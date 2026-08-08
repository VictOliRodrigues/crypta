# ADR 0022 — Credenciais e tokens no servidor

## Status

ACCEPTED

## Data

2026-08-08

## Contexto

O [ADR 0021](0021-session-token-lifetimes.md) fechou os prazos das sessões e declarou a R0.2 desbloqueada. Ao escrever o módulo `auth` ficou claro que não estava: quatro decisões continuam abertas, todas do lado do servidor, e nenhuma delas tem valor registrado em lugar nenhum.

`SECURITY.md` secao 14 exige que o `AuthSecret` seja "hasheado novamente no servidor" e não diz com o quê. A secao 30 exige que o refresh token tenha "hash no banco" e não diz qual. A secao 29 exige "assinatura forte" e "chave fora do repositório", enquanto `.env.example` já reserva `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` — o que decide que é assimétrico, mas não qual curva nem qual biblioteca. A secao 26 exige "bloqueio progressivo" sem um único número.

São quatro lacunas de implementação, não quatro temas independentes: as quatro descrevem como o servidor guarda e verifica credencial. Fechá-las separadamente produziria quatro ADRs que se referenciam mutuamente para explicar o mesmo modelo de ameaça. Ficam em `PEND-026`, e neste ADR.

### O que o servidor guarda, e contra quem

`SECURITY.md` secao 8.1 nomeia "atacante com banco vazado" como ator. `DATABASE.md` secao 9 registra que os secrets do servidor têm backup próprio, **separado do banco**. Essas duas frases juntas definem o cenário que dimensiona as decisões 1 e 2: o vazamento mais provável — dump, backup extraviado, SQL injection — entrega o banco sem entregar os secrets da aplicação.

E há a assimetria que o [ADR 0004](0004-auth-secret-domain-separation.md) criou de propósito: o `AuthSecret` autentica e **não** descriptografa. Um atacante com o banco inteiro e todos os `AuthSecret` em texto aberto conseguiria se passar por qualquer usuário, mas continuaria diante de blobs que não abre, porque a `UserEncryptionKey` deriva da senha e nunca sai do cliente. O que a decisão 1 protege, portanto, é a autenticação — não o conteúdo.

### O que já foi pago no cliente

O `AuthSecret` não é senha. É `HKDF-SHA-256(Argon2id(senha, salt, 64 MiB, t=3, p=1), info="auth")`, pelos ADRs 0016 e 0018 — 32 bytes de saída de uma derivação que custa cerca de 288 ms no desktop de referência.

Isso muda o cálculo do hash no servidor. Diante de um banco vazado, o atacante que quer a senha precisa rodar o Argon2id do cliente a cada tentativa; esse custo já domina qualquer coisa que o servidor acrescente. Um segundo Argon2id no servidor multiplicaria o custo offline por um fator próximo de dois, e em troca dobraria o custo de todo login legítimo — em uma rota **não autenticada**, o que a torna um vetor de negação de serviço por memória em uma VPS pequena.

## Decisão

### 1. Verificador do `AuthSecret` — HMAC-SHA-256 com pepper do servidor (`PEND-026`)

```text
auth_secret_hash = HMAC-SHA-256(pepper, authSecret)
```

O `AuthSecret` trafega em base64url e precisa decodificar para **exatamente 32 bytes**; qualquer outro tamanho é `400`, antes de qualquer comparação. A comparação do verificador é em tempo constante.

O pepper **não fica no banco**. Ele é derivado do `AUTH_SERVER_SECRET`, uma variável de ambiente, e é isso que separa este desenho de um `SHA-256` simples: quem obtém apenas o dump não consegue nem começar o ataque offline contra a senha, porque não tem o pepper. Precisaria também do secret da aplicação, que tem outra superfície de exposição e outro backup.

A função é rápida de propósito. O fator de trabalho contra a senha é o Argon2id do cliente, que já foi pago; repeti-lo aqui compraria pouco e abriria a rota de login à exaustão de memória.

### 2. Segredo do servidor e sua rotação

Um único segredo por ambiente, com separação de domínio no mesmo espírito do ADR 0004:

```text
AUTH_SERVER_SECRET
    ├── HKDF-SHA-256(info="auth-secret-pepper")    → pepper do verificador
    └── HKDF-SHA-256(info="kdf-parameters-decoy")  → segredo dos parâmetros sintéticos
```

O segundo ramo alimenta `GET /auth/parameters`: `API.md` secao 21 manda devolver parâmetros sintéticos válidos para e-mail inexistente, e eles precisam ser **estáveis por e-mail**. Sorteá-los a cada requisição faria duas consultas ao mesmo endereço devolverem `kdfSalt` diferente, que é exatamente o oráculo de enumeração que `SECURITY.md` secao 25 manda evitar. Derivá-los do e-mail normalizado com este segredo os torna determinísticos sem os tornar previsíveis.

**Formato e rotação.** O valor é `v<N>:<base64url de 32 bytes>`; `AUTH_SERVER_SECRET_PREVIOUS` é opcional e tem o mesmo formato. A tabela de usuários guarda a versão que gerou o verificador de cada linha.

Perder o segredo sem ter como rotacioná-lo tornaria **toda conta inacessível para sempre**, e a V1 não tem recuperação (`SECURITY.md` secao 28). Por isso a rotação é preguiçosa e não exige que ninguém troque de senha: no login, o verificador é conferido com o segredo da versão gravada na linha; se essa versão não for a corrente, o verificador é recalculado com a corrente e regravado na mesma transação. Uma versão antiga só pode ser descartada quando nenhuma linha ainda a referenciar.

### 3. Refresh token — 32 bytes aleatórios, SHA-256 em repouso

O token é opaco: 32 bytes de CSPRNG, transportado em base64url sem padding. Em repouso fica `SHA-256(token)`, com índice único, e a busca é feita **pelo hash** — não há varredura nem comparação linha a linha.

Aqui não há pepper, e a ausência é deliberada. O pepper da decisão 1 existe para impedir um ataque offline contra um segredo de entropia limitada — a senha. O refresh token não tem preimagem adivinhável: são 256 bits de aleatoriedade sem estrutura. Contra ele o atacante não tem o que tentar, com ou sem pepper. Acrescentá-lo seria simetria estética, e custaria fazer a rotação do segredo derrubar todas as sessões vivas.

### 4. Access token — EdDSA sobre Ed25519, pela `jose`

```text
alg  EdDSA (Ed25519)
iss  a URL base da API do ambiente
aud  crypta-api
sub  id do usuário
sid  id da sessão
iat  emissão
exp  emissão + ACCESS_TOKEN_TTL
```

Nada além disso. `SECURITY.md` secao 29 proíbe informação sensível no token, e nome e e-mail não têm por que estar ali: quem precisa deles chama `GET /users/me`.

**Ed25519** porque não tem parâmetro para errar. RSA exige escolher tamanho de chave, e ECDSA depende de nonce por assinatura — reutilizá-lo revela a chave privada. Ed25519 é determinístico e tem chave de 32 bytes, o que também torna a variável de ambiente pequena.

**`jose`** em vez de `@nestjs/jwt` com `jsonwebtoken`. A `jose` não tem dependências, suporta Ed25519 pelo `crypto` nativo do Node 24 e **exige que o algoritmo esperado seja passado na verificação**. Isso fecha por construção a classe de falha de confusão de algoritmo — `alg: none` e a troca de assimétrico por simétrico — que é a origem recorrente de CVE em bibliotecas de JWT. A verificação recusa qualquer token cujo cabeçalho não declare `EdDSA`.

**Formato da chave.** `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` recebem o **base64 do PEM**, em uma linha. O PEM cru é multilinha, e `config_user.md` secao 41.1 já registra uma variable com quebra de linha invisível como causa de run perdido nesta infraestrutura. Uma linha só elimina a classe inteira.

Na partida a API decodifica as duas, confirma que são Ed25519 e **assina e verifica um valor de prova** para garantir que formam par. Chave trocada entre ambientes falha ali, não na primeira requisição de um usuário. As chaves são por ambiente e nunca compartilhadas (`CLAUDE.md` secao 65).

### 5. Bloqueio progressivo, e o oráculo que ele criaria

**Por conta, no MySQL.** O contador de falhas consecutivas e o instante de liberação ficam na linha do usuário. Ficariam mais baratos em memória, mas sumiriam no restart do container e divergiriam entre réplicas — um controle de segurança que o deploy zera não é controle.

Após `LOGIN_MAX_ATTEMPTS` falhas consecutivas a conta entra em espera de `LOGIN_LOCK_INITIAL_SECONDS`, que dobra a cada nova falha até `LOGIN_LOCK_MAX_SECONDS`. Um login bem-sucedido zera tudo. **Nunca há bloqueio permanente**: `SECURITY.md` secao 26 pede exatamente isso, porque um bloqueio permanente disparável por terceiros é negação de serviço contra o dono da conta.

**Por IP**, em memória do processo, como filtro grosseiro anterior: `AUTH_IP_RATE_LIMIT` requisições por minuto sobre as rotas de autenticação, pelo `@nestjs/throttler`. Em memória basta porque o controle autoritativo é o da conta; com mais de uma réplica o teto efetivo por IP passa a ser o limite vezes o número de réplicas, e isso está registrado como limitação aceita, não como descuido.

**O oráculo.** `API.md` secao 22 lista `ACCOUNT_LOCKED` e `ACCOUNT_DISABLED` entre os erros de login, e `SECURITY.md` secao 25 exige que a resposta não revele se a conta existe. As duas coisas não podem valer ao mesmo tempo: quem recebe `ACCOUNT_LOCKED` depois de cinco tentativas descobriu que o endereço está cadastrado, e enumerar a base vira uma questão de tempo.

A resolução:

> **O estado da conta só é revelado a quem já provou conhecer a credencial.**

Um login com `AuthSecret` errado, com e-mail inexistente ou contra conta bloqueada devolve sempre `401 INVALID_CREDENTIALS` e a mesma mensagem pública. `ACCOUNT_LOCKED` e `ACCOUNT_DISABLED` só aparecem quando o `AuthSecret` **confere** e mesmo assim o acesso é negado — nesse ponto o chamador já demonstrou ter a senha, e informá-lo não entrega nada que ele não soubesse. O usuário legítimo continua recebendo a explicação de que precisa; o enumerador, não.

Isso muda `API.md`, não `SECURITY.md`: na hierarquia do `CLAUDE.md` secao 2, `SECURITY.md` está acima.

Duas consequências operacionais para não reintroduzir o oráculo por outro caminho: a verificação do bloqueio acontece **depois** do cálculo do verificador, nunca antes, e e-mail inexistente executa um HMAC descartável de mesmo custo — do contrário o tempo de resposta separa os dois casos que os códigos passaram a igualar.

### 6. Variáveis, faixas e falha na partida

Mesmo padrão dos ADRs 0018 e 0021: valor inicial por deployment, faixa validada na partida, revisável dentro da faixa sem novo ADR. Fora da faixa, a API **não sobe**.

| Variável                      | Padrão | Faixa aceita | Obrigatória |
| ----------------------------- | ------ | ------------ | ----------- |
| `AUTH_SERVER_SECRET`          | —      | 32 bytes     | sim         |
| `AUTH_SERVER_SECRET_PREVIOUS` | vazia  | 32 bytes     | não         |
| `JWT_PRIVATE_KEY`             | —      | Ed25519      | sim         |
| `JWT_PUBLIC_KEY`              | —      | Ed25519      | sim         |
| `LOGIN_MAX_ATTEMPTS`          | `5`    | `3`–`20`     | não         |
| `LOGIN_LOCK_INITIAL_SECONDS`  | `60`   | `10`–`600`   | não         |
| `LOGIN_LOCK_MAX_SECONDS`      | `900`  | `60`–`86400` | não         |
| `AUTH_IP_RATE_LIMIT`          | `60`   | `10`–`600`   | não         |

`LOGIN_LOCK_MAX_SECONDS` menor que `LOGIN_LOCK_INITIAL_SECONDS` é erro de partida, não um valor a ser corrigido em silêncio.

## Alternativas consideradas

**Argon2id no servidor sobre o `AuthSecret`.** É a resposta reflexa, e seria correta se o valor recebido fosse uma senha. Não é: o Argon2id já foi executado no cliente com os parâmetros do ADR 0018, e o custo offline por tentativa já é o dele. Repeti-lo com parâmetros equivalentes acrescentaria um fator próximo de dois ao atacante e dobraria a latência de cada login legítimo, com 64 MiB por requisição concorrente em uma rota não autenticada. Rejeitada por trocar um ganho marginal por um vetor de negação de serviço.

**Argon2id no servidor com parâmetros baratos.** Rejeitada por ser cerimônia: barato o bastante para não ser DoS é barato o bastante para não somar nada ao custo do atacante.

**bcrypt.** Rejeitada. Trunca em 72 bytes e trata `NUL` de forma peculiar, então limita a entropia do valor que deveria proteger; e, sendo lenta, herda o mesmo argumento de DoS sem nenhuma vantagem sobre o Argon2id.

**SHA-256 com salt por usuário, sem pepper.** É a alternativa séria. Rejeitada porque o salt não resolve nada aqui — o `kdfSalt` do cliente já é por usuário, então não existe tabela pré-computada a impedir — enquanto o pepper resolve um cenário concreto e provável: o dump que sai sem os secrets da aplicação. O custo do pepper é a rotação, e a decisão 2 a torna possível.

**Nenhum segredo do servidor, para não criar um ponto único de perda.** Rejeitada, mas é a consequência negativa mais séria desta decisão e está registrada abaixo. O que a torna aceitável é a rotação preguiçosa: o segredo é substituível sem que ninguém troque de senha, e a operação de backup dele já existe por causa das chaves JWT.

**HS256 com segredo compartilhado no access token.** Mais simples e sem par de chaves. Rejeitada: `.env.example` já reservou o par assimétrico, e verificação com chave pública é o que permitirá a uma extensão de navegador — ou a qualquer outro verificador futuro — validar um token sem poder emitir um.

**RS256.** Rejeitada. Chave de 2048 bits ou mais em variável de ambiente, assinatura maior em toda requisição e mais parâmetros para errar, sem nenhuma vantagem sobre Ed25519 neste uso.

**`@nestjs/jwt` com `jsonwebtoken`.** Integra melhor com o Nest e é o caminho mais trilhado. Rejeitada pela superfície: árvore de dependências maior em um ponto crítico (`CLAUDE.md` secao 60) e uma API que aceita verificar sem que o chamador declare o algoritmo esperado, que é a porta da confusão de algoritmo. A `jose` obriga a declarar.

**Bloqueio só por IP.** Rejeitada. Um atacante com IPs rotativos passa direto, e o dono da conta fica sem proteção justamente no caso que importa.

**Bloqueio por conta em memória.** Rejeitada. Some no restart — que neste projeto acontece a cada deploy — e diverge entre réplicas.

**Manter `ACCOUNT_LOCKED` no login sempre.** Rejeitada por ser oráculo de enumeração. A versão condicionada à autenticação bem-sucedida entrega a mesma informação a quem tem direito a ela.

## Consequências positivas

- O módulo `auth` fica de fato desbloqueado: as quatro lacunas que impediam escrever o código estão fechadas com valor.
- Um dump do banco sem os secrets da aplicação não permite sequer iniciar o ataque offline contra as senhas.
- O verificador guardado não é replayável como credencial, que é o requisito mínimo de `SECURITY.md` secao 14.
- O login não vira vetor de exaustão de memória, porque não executa KDF caro em rota não autenticada.
- A classe de falha de confusão de algoritmo em JWT fica fechada por construção da biblioteca, não por disciplina.
- Chave trocada entre ambientes falha na partida, e não na primeira requisição real de um usuário.
- A enumeração de contas some do login sem que o usuário legítimo perca a explicação do bloqueio.
- O segredo do servidor é rotacionável sem que nenhum usuário precise trocar de senha.

## Consequências negativas

- Nasce um segredo cuja perda torna toda conta inacessível. É a mudança de risco mais séria deste ADR, e não tem mitigação técnica além da rotação e do backup — a V1 não tem recuperação de conta.
- A tabela de usuários passa a guardar estado de bloqueio, então uma tentativa de login falha vira escrita no banco. Em rota não autenticada isso é superfície de carga, contida pelo filtro por IP.
- O limite por IP em memória degrada com mais de uma réplica, e degrada em silêncio.
- Duas dependências novas em um ponto crítico: `jose` e `@nestjs/throttler`.
- A versão do segredo em cada linha é complexidade que só se paga no dia da rotação, e até lá parece código sem uso.
- `ACCOUNT_LOCKED` deixar de aparecer no login errado torna o diagnóstico de suporte mais difícil: o operador precisa olhar o log, não a resposta.

## Riscos

- **Perda do `AUTH_SERVER_SECRET`.** Risco central. Mitigação: `config_user.md` passa a exigi-lo no mesmo backup das chaves JWT, com o efeito da perda escrito por extenso; a validação de partida recusa subir sem ele, então a ausência aparece no deploy e não no primeiro login.
- **Verificação do bloqueio antes do cálculo do verificador**, reintroduzindo o oráculo por timing depois de ele ter sido fechado por código. Mitigação: teste que compara a distribuição de tempo entre e-mail inexistente, segredo errado e conta bloqueada.
- **Rotação do segredo interrompida no meio**, com linhas em duas versões e a antiga já descartada do ambiente. Mitigação: a versão antiga só pode ser removida quando nenhuma linha a referenciar, e isso é uma consulta, não uma suposição.
- **`jose` ou `@nestjs/throttler` abandonadas.** Mitigação: as duas são isoláveis atrás de um serviço próprio; a `jose` é a implementação de referência de JOSE em JavaScript e o `throttler` é oficial do Nest.
- **Bloqueio usado como negação de serviço** contra um usuário conhecido, disparando falhas de propósito. Mitigação: o teto de `LOGIN_LOCK_MAX_SECONDS` e a ausência de bloqueio permanente limitam o dano a uma janela; o log registra IP e request ID para investigação.
- **Números escolhidos sem uso real.** Como no ADR 0021, vêm do modelo de ameaça e não de telemetria. Assumido, e revisável dentro das faixas sem novo ADR.

## Impactos

- **Código:** módulo `auth` (verificador, emissão e verificação de JWT, contagem de falhas, throttle), derivação do pepper e do segredo dos parâmetros sintéticos, validação de partida das oito variáveis e do par de chaves.
- **Banco:** a tabela de usuários ganha o verificador, a versão do segredo, o contador de falhas consecutivas e o instante de liberação; a de sessões ganha o hash do refresh token com índice único. Entram na migration de identidade (BLG-0502).
- **API:** `POST /auth/login` deixa de devolver `ACCOUNT_LOCKED` e `ACCOUNT_DISABLED` a quem não autenticou; `GET /auth/parameters` passa a exigir parâmetros sintéticos determinísticos.
- **Segurança:** torna vinculantes as secoes 14, 26, 29 e 30 do `SECURITY.md`, hoje escritas como requisito sem valor.
- **Dependências:** `jose` e `@nestjs/throttler` em `apps/api`.
- **Deploy:** quatro variáveis novas obrigatórias por ambiente, uma delas com perda irreversível se extraviada.
- **Documentação:** `SECURITY.md` secoes 14, 26, 29 e 30; `API.md` secoes 21 e 22; `ARCHITECTURE.md` secoes 14.4 e 17; `.env.example`; `config_user.md`; `DECISIONS.md` DEC-049 e `PEND-026`.

## Plano de migração

Não se aplica. Não existe usuário, sessão, tabela nem módulo de autenticação.

Trocar qualquer decisão depois custa diferente. O algoritmo do verificador exige que todo usuário reapresente a senha, porque o servidor não tem como recalcular o verificador sem ela — seria uma migração preguiçosa no login, com uma coluna de algoritmo por linha. O hash do refresh token exige apenas invalidar as sessões vivas. Trocar o algoritmo de assinatura do access token custa no máximo os 15 minutos do token mais longo em circulação. Os números de bloqueio são configuração.

## Referências internas

- [ADR 0004](0004-auth-secret-domain-separation.md) — a separação que faz o `AuthSecret` autenticar sem descriptografar, e o mesmo padrão de HKDF por contexto usado aqui no segredo do servidor.
- [ADR 0010](0010-session-strategy.md) — a forma da sessão, incluindo o hash do refresh token em repouso que esta decisão especifica.
- [ADR 0016](0016-argon2id-libsodium-wasm.md) e [ADR 0018](0018-argon2id-parameters.md) — o custo já pago no cliente, que é a razão de o verificador ser rápido.
- [ADR 0021](0021-session-token-lifetimes.md) — os prazos que este ADR complementa; mesmo padrão de faixa validada na partida.
- [ADR 0009](0009-coolify-deployment.md) — isolamento entre ambientes, que obriga chave e segredo próprios em cada um.
- `SECURITY.md` secoes 8, 14, 24, 25, 26, 29 e 30 — ameaças, `AuthSecret`, login, enumeração, bloqueio e tokens.
- `docs/API.md` secoes 21 e 22 — parâmetros KDF e login.
- `docs/DATABASE.md` secao 9 — backup dos secrets separado do banco, premissa da decisão 1.
- `CLAUDE.md` secoes 2, 9, 36, 59, 60, 65 e 82 — hierarquia, falhar fechado, logs, dependências e checklist de mudança de autenticação.
- `docs/DECISIONS.md` DEC-049 e `PEND-026`.
