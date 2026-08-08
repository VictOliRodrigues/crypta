# ADR 0018 — Parâmetros iniciais do Argon2id

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

`PEND-004` pedia os valores de `memoryKib`, `iterations` e `parallelism` que `Argon2idParameters` carrega por usuário. `ARCHITECTURE.md` secao 43.3 exige medição em três superfícies — navegador desktop, Android médio e Android mais fraco suportado — e define o alvo como equilíbrio entre resistência, login aceitável, consumo de memória e estabilidade. Não há orçamento de tempo declarado em lugar nenhum do projeto: "login aceitável" é a única baliza.

Os números que aparecem em `docs/API.md` (`kdfMemory: 65536`, `kdfIterations: 3`, `kdfParallelism: 1`) sempre foram ilustrativos, nunca decididos.

**O que foi medido, e onde.** Grade completa com `libsodium-wrappers-sumo` 0.8.4, `p=1`, salt de 16 bytes, saída de 32 bytes, mediana de 5 execuções, em `Intel i5-9400F @ 2.90 GHz`, Node v24.14.0, Windows 11:

| m      |    t=1 |    t=2 |    t=3 |
| ------ | -----: | -----: | -----: |
| 19 MiB |  54 ms |  74 ms |  94 ms |
| 32 MiB |  50 ms | 104 ms | 155 ms |
| 46 MiB |  74 ms | 143 ms | 208 ms |
| 64 MiB |  92 ms | 193 ms | 288 ms |
| 96 MiB | 132 ms | 275 ms | 441 ms |

**O que não foi medido.** Nenhum navegador e nenhum Android. As medições acima usam o mesmo WebAssembly que a Web usará, mas em Node, o que as torna uma aproximação de desktop, não a medição que `ARCHITECTURE.md` secao 43.3 pede. Por isso **estes valores são provisórios**, e a revisão está presa a um gatilho explícito no plano de migração.

Há ainda um limite de método que precisa ficar registrado: `performance.measureUserAgentSpecificMemory()` exige `crossOriginIsolated`, e o projeto não define COEP em lugar nenhum. Memória de pico no navegador **não é mensurável de forma confiável hoje**. O que se sabe é que o pico acompanha `m` — medido em Node, `m=64 MiB` custou cerca de 65 MiB de pico, igual nas três bibliotecas avaliadas no ADR 0016.

## Decisão

Os parâmetros iniciais são:

```text
memoryKib   = 65536      64 MiB
iterations  = 3
parallelism = 1
salt        = 16 bytes aleatórios por usuário
saída       = 32 bytes
```

Custam 288 ms na máquina de referência acima. Ficam bem acima do piso do OWASP para Argon2id (19 MiB, `t=2`, `p=1`) e usam a memória e o número de passagens da segunda configuração recomendada pelo RFC 9106 secao 4, aquela para ambientes com menos memória disponível.

O RFC recomenda `p=4` nessa configuração; aqui `p=1` porque o libsodium não expõe o parâmetro (ADR 0016). A memória total e a contagem de passagens não mudam, e um navegador single-threaded não exploraria as lanes de qualquer forma.

`64 MiB` tem ainda uma propriedade defensiva que pesou na escolha: fica **abaixo do ponto em que o fallback `wasm2js` do libsodium passa a calcular Argon2id errado**, que o ADR 0016 mediu em cerca de 72 MiB. Se algum caminho de build escapar da regra do ESM, esses parâmetros permanecem na faixa correta. Os presets `MODERATE` e `SENSITIVE` do próprio libsodium, 256 MiB e 1 GiB, caem dentro da faixa corrompida e por isso estão descartados independentemente de desempenho.

Os parâmetros continuam gravados por usuário, como `ARCHITECTURE.md` secao 14.5 e o ADR 0004 já exigiam. Este ADR define o padrão para contas novas, não um valor global.

**Parâmetros sintéticos precisam ser deterministas.** `GET /auth/parameters` devolve parâmetros válidos para e-mail inexistente, para não virar oráculo de enumeração. Se o salt sintético for aleatório a cada requisição, duas chamadas para o mesmo endereço distinguem conta real de inexistente — o salt de uma conta real se repete, o da inexistente não. Os valores sintéticos precisam ser derivados do e-mail por HMAC com segredo do servidor, e emitir exatamente o conjunto padrão acima. Enquanto o padrão for o mesmo para contas novas e sintéticas, os dois casos são indistinguíveis por valor.

## Alternativas consideradas

**19 MiB com `t=2`, o piso do OWASP.** Rejeitada como padrão. Custaria 74 ms no desktop de referência, deixando fator de trabalho na mesa sem ganho perceptível de experiência. É o piso de uma recomendação genérica para hashing de senha no servidor, não um alvo para um cofre onde o custo já está no cliente.

**2 GiB com `t=1`, a primeira opção do RFC 9106.** Rejeitada. Inviável em aba de navegador, e muito acima do que qualquer Android suportaria. É a recomendação para quem controla o hardware.

**96 MiB com `t=3`.** Rejeitada por margem. Custa 441 ms no desktop de referência — ainda aceitável ali, mas já dentro da faixa em que o fallback `wasm2js` corrompe, e sem folga para o Android mais fraco, que ainda não foi medido.

**Calibrar em tempo de execução, medindo a máquina do usuário no cadastro.** Rejeitada por ora. Daria parâmetros ajustados a cada dispositivo, mas torna o valor dependente do aparelho usado no cadastro — que pode ser o mais rápido que a pessoa tem — e transforma os parâmetros em sinal de fingerprinting no endpoint público. Pode ser reconsiderada com ADR próprio.

**Adiar até haver Android.** Rejeitada. Bloquearia a R0.2 inteira por uma medição que só faz sentido na R0.7, quando o cliente Android existir. Os parâmetros são por usuário justamente para permitir recalibração.

## Consequências positivas

- Contas novas nascem com fator de trabalho bem acima do piso recomendado, a um custo medido de 288 ms em desktop.
- A escolha fica fora da faixa em que o fallback do libsodium corrompe a derivação, o que dá uma segunda camada de proteção contra o defeito descrito no ADR 0016.
- Os valores coincidem com os que `docs/API.md` já usava nos exemplos, então nenhum documento de contrato precisa mudar de número.
- Os parâmetros por usuário permitem subir o custo depois sem invalidar conta alguma.

## Consequências negativas

- 64 MiB é bastante memória para uma aba de navegador em celular, e isso não foi medido em celular nenhum.
- O login ganha um custo perceptível, proporcionalmente maior nos aparelhos mais fracos.
- Os valores são provisórios, então a documentação carrega uma decisão que se sabe incompleta até a R0.7.
- Prender o padrão ao gerador de parâmetros sintéticos significa que mudar o padrão obriga a atualizar os dois em conjunto, sob risco de tornar contas distinguíveis pelo valor.

## Riscos

- **Inviabilidade no Android mais fraco.** É o risco principal e permanece aberto por construção. Mitigação: a medição na R0.7 é gatilho de revisão declarado no plano de migração, e os parâmetros por usuário permitem que contas antigas fiquem onde estão.
- **Falha de alocação em aba de celular.** 64 MiB pode falhar em dispositivos com pouca memória, e a memória de pico não é mensurável hoje por falta de `crossOriginIsolated`. Mitigação: tratar falha de alocação como erro declarado, nunca como motivo para reduzir parâmetros silenciosamente.
- **Oráculo de enumeração pelo salt sintético.** Mitigação: derivação determinística por HMAC do e-mail, e o tempo de resposta do caminho sintético precisa acompanhar o da consulta real.
- **Divergência entre padrão novo e contas antigas.** Quando o padrão subir, contas antigas continuam com o valor gravado até rederivarem. Mitigação: o fluxo do plano de migração.

## Impactos

- **Código:** valores padrão em `packages/crypto-web`; o gerador determinístico de parâmetros sintéticos na API.
- **Banco:** as colunas de parâmetros KDF por usuário, previstas em `DATABASE.md`, passam a ter valor padrão definido.
- **API:** nenhum contrato muda; `docs/API.md` já usava exatamente estes números como exemplo.
- **Segurança:** fixa o fator de trabalho contra o ataque de `SECURITY.md` secao 8.2.
- **Deploy:** nenhum.
- **Documentação:** `DECISIONS.md` DEC-045 e PEND-004.

## Plano de migração

Não há o que migrar hoje: nenhuma conta existe.

**Gatilho de revisão.** Este ADR é revisto quando o cliente Android existir na R0.7 e a medição de `ARCHITECTURE.md` secao 43.3 puder ser feita nas três superfícies. Se os parâmetros mudarem, o ADR é substituído, não editado.

**Como uma conta existente muda de parâmetros.** `RootKey` alimenta `AuthSecret` e `UserEncryptionKey`, então mudar Argon2id muda os dois. A rederivação só é possível no instante em que o cliente tem a senha em texto aberto, isto é, durante um login bem-sucedido:

1. o cliente busca os parâmetros gravados e deriva a `RootKey` antiga;
2. autentica normalmente com o `AuthSecret` antigo;
3. com a senha ainda em memória, gera salt novo e deriva a `RootKey` nova nos parâmetros novos;
4. deriva `AuthSecret` e `UserEncryptionKey` novos;
5. reencripta a chave privada X25519 com a `UserEncryptionKey` nova;
6. envia salt, parâmetros, novo hash de `AuthSecret` e a chave privada reencriptada em **uma transação**.

Nada além da chave privada é reencriptado: as `VaultKey` não dependem da `RootKey`.

Falhas a tratar explicitamente na implementação:

- **abandono no meio.** Enquanto o passo 6 não confirmar, a conta permanece válida nos parâmetros antigos. A migração é oportunista, nunca destrutiva.
- **dois dispositivos.** O segundo a chegar encontra parâmetros já atualizados e não deve tentar migrar de novo; o passo 6 precisa ser condicional ao estado esperado.
- **troca de senha concorrente.** Troca de senha já gera salt novo e reencripta a chave privada. As duas operações competem pelo mesmo registro e precisam da mesma transação e do mesmo controle de versão.
- **offline.** Sem o passo 6 confirmado, não há migração. O cliente não pode gravar estado parcial.

## Referências internas

- `packages/crypto-core/src/adapters/crypto-adapters.ts` — `Argon2idParameters`.
- `docs/API.md` — `POST /setup`, `GET /auth/parameters` e `GET /users/me/key-bundle`.
- `docs/DATABASE.md` — as colunas de parâmetros KDF por usuário.
- `ARCHITECTURE.md` secoes 14.3, 14.5, 25 e 43.3 — derivação, par de chaves, troca de senha e calibração.
- `SECURITY.md` secoes 8.2 e 13 — força bruta offline e requisitos de derivação.
- `CLAUDE.md` secao 72 — não declarar validação que não foi executada.
- [ADR 0004](0004-auth-secret-domain-separation.md) — parâmetros por usuário e o endpoint de parâmetros.
- [ADR 0016](0016-argon2id-libsodium-wasm.md) — a biblioteca, o limite de 72 MiB e a fixação de `p=1`.
