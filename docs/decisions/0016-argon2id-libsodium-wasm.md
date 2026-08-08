# ADR 0016 — Argon2id na Web pelo libsodium em WebAssembly

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

`CLAUDE.md` secao 8 fixa Argon2id como a função que transforma a senha do usuário em `RootKey`. O algoritmo estava decidido; a implementação, não. `PEND-001` bloqueava a R0.2 inteira, porque `KdfAdapter.deriveRootKey` é a primeira coisa que qualquer fluxo de identidade executa.

O custo do Argon2id fica no cliente (ADR 0004), então cada milissegundo aparece no login e cada MiB aparece na aba do navegador. Ao mesmo tempo, o parâmetro de custo é a única defesa contra o ataque que `SECURITY.md` secao 8.2 descreve: força bruta offline sobre um dump do MySQL. Uma implementação lenta não é um detalhe de desempenho — ela obriga a baixar o custo, e baixar o custo enfraquece a proteção.

As três implementações candidatas foram medidas, não pesquisadas. Em `Intel i5-9400F @ 2.90 GHz`, Node v24.14.0, com `p=1`, salt de 16 bytes e saída de 32 bytes:

| params       | libsodium (WASM) | hash-wasm (WASM) | @noble/hashes (JS puro) |
| ------------ | ---------------: | ---------------: | ----------------------: |
| 19 MiB, t=2  |            55 ms |           115 ms |                 1088 ms |
| 64 MiB, t=3  |           296 ms |           550 ms |                 5339 ms |
| 128 MiB, t=3 |           606 ms |           964 ms |                10550 ms |

As três produzem **bytes idênticos** com `p=1` e salt de 16 bytes, e `@noble/hashes` reproduz o vetor conhecido do RFC 9106 secao 5.3. O consumo de memória de pico é o mesmo nas três, cerca de 65 MiB para `m=64 MiB`: a memória é o bloco do próprio Argon2, não a biblioteca. Velocidade é o único diferenciador real.

## Decisão

A Web usa **`libsodium-wrappers-sumo`** para Argon2id, por `crypto_pwhash` com `crypto_pwhash_ALG_ARGON2ID13`.

O build **sumo** é obrigatório: o `libsodium-wrappers` padrão declara `crypto_pwhash` no seu `.d.ts` mas **não o expõe em runtime**. O TypeScript compila e o navegador quebra.

Três invariantes acompanham a escolha:

```text
parallelism = 1          libsodium não expõe o parâmetro; fixa 1 lane
salt        = 16 bytes   libsodium rejeita 8 e 32 bytes
saída       = 32 bytes
```

`docs/API.md` já especifica `kdfParallelism: 1`, então o contrato de rede não muda.

**Somente o build ESM.** O build CommonJS embute um fallback `wasm2js` que, acima de aproximadamente 72 MiB, devolve uma chave **errada sem lançar erro** — medido: a mesma chave incorreta para 80, 96 e 128 MiB, ou seja, o parâmetro de memória é ignorado. O `MEMLIMIT_MODERATE` do próprio libsodium, 256 MiB, cai dentro dessa faixa. O ESM não tem fallback: sem WebAssembly ele aborta alto. Para um cofre, falhar alto é o comportamento correto — uma `RootKey` irreproduzível torna o cofre permanentemente inabrível.

**Self-test na inicialização.** Antes do primeiro uso real, o adapter deriva um vetor conhecido nos parâmetros de produção e compara com o valor esperado. Divergência impede o destravamento. É o que pega essa classe de defeito independentemente de qual build o bundler resolveu.

**CSP.** `'wasm-unsafe-eval'` entra em `script-src` de `apps/web/security-headers.conf`. A compilação de WebAssembly é bloqueada por CSP em todos os navegadores atuais — Chrome 97, Firefox 102, Safari 16 — e a origem dos bytes é irrelevante: o portão é a compilação, não o `fetch`. `'wasm-unsafe-eval'` é estritamente mais estreito que `'unsafe-eval'`, que `SECURITY.md` secao 50 desaconselha: `eval()` de JavaScript continua bloqueado.

**`CryptoAdapter` ganha `init(): Promise<void>`.** O libsodium exige `await sodium.ready` antes de qualquer chamada, e o contrato atual não tem onde colocar isso. Hoje a mudança é gratuita: `crypto-web` e `crypto-mobile` estão vazios e não existe um único consumidor. Depois de existir cofre, seria mudança de contrato.

## Alternativas consideradas

**`hash-wasm`.** Tecnicamente adequada: WASM, MIT, byte-idêntica, e o módulo de Argon2id custa cerca de 12 KiB gzip contra 183 KiB do sumo — uma diferença real. Rejeitada por manutenção. O último commit do repositório é de 19 de novembro de 2024, com 13 issues abertas: 21 meses parado. `CLAUDE.md` secao 59 e `SECURITY.md` secao 83 exigem dependência mantida, e criptografia é dependência crítica pela secao 60. Uma biblioteca dormente é aceitável para formatar data, não para a função que protege o cofre.

**`@noble/hashes`.** A mais bem mantida das três, com provenance SLSA, zero dependências e auditoria da Cure53. Rejeitada **para produção** por ser cerca de 20x mais lenta: 1088 ms em 19 MiB num desktop já ultrapassa o aceitável, e o Android mais fraco suportado ficaria inviável. Como o custo em JS puro obrigaria a derrubar os parâmetros, a opção é pior justamente no eixo que `SECURITY.md` secao 8.2 protege. **Adotada, porém, como oráculo de teste** em `devDependencies` — ver ADR 0017.

**`argon2-browser`.** Rejeitada. Nenhuma versão publicada desde 5 de junho de 2021.

**Manter tudo em JS puro para não mexer na CSP.** Rejeitada pelo responsável do projeto, com a alternativa apresentada e o custo medido. Trocaria uma diretiva de CSP estritamente delimitada por uma perda de fator de trabalho que atinge todos os usuários.

## Consequências positivas

- Argon2id em 55 ms com 19 MiB abre orçamento real de fator de trabalho: dá para escolher parâmetros pela resistência, não pela lentidão da biblioteca.
- A implementação em C do libsodium é auditada há mais de uma década e é a mesma que o Android usará, o que torna a igualdade de bytes entre plataformas propriedade do build, e não algo que a suíte de testes precise policiar sozinha.
- `libsodium.js` é mantido pelo autor do libsodium, com push em 14 de julho de 2026 e nenhuma issue aberta.
- A decisão é barata de reverter: as três implementações são byte-idênticas em `p=1`, então trocar de biblioteca não exige migração criptográfica.

## Consequências negativas

- A CSP fica mais permissiva. `'wasm-unsafe-eval'` é estreito, mas é uma diretiva a mais e precisa ser justificada em revisão.
- O bundle cresce cerca de 183 KiB gzip, quase todo do blob WebAssembly embutido em base64 — e base64 não comprime de volta, custando cerca de 30 KiB gzip a mais do que o `.wasm` cru custaria.
- O `sumo` traz centenas de símbolos que o projeto não usa, ampliando a superfície de uma dependência crítica.
- `await sodium.ready` introduz assincronismo na inicialização do cliente, que o `init()` do contrato passa a carregar.
- Sem WebAssembly disponível o aplicativo não funciona. É deliberado, mas é uma porta fechada, não uma degradação.

## Riscos

- **Fallback `wasm2js` corrompendo a `RootKey`.** É o risco principal e foi medido, não suposto. Mitigação em camadas: apenas o build ESM, que não tem fallback; um teste que trava essa resolução no bundle; e o self-test de vetor na inicialização, que recusa destravar em divergência.
- **Um único mantenedor.** `libsodium.js` tem um mantenedor no npm e nenhuma attestation de provenance. Mitigação: versão fixada no lockfile, `pnpm audit` na CI e o oráculo independente do ADR 0017, que detecta mudança silenciosa de saída entre versões.
- **`'wasm-unsafe-eval'` virar `'unsafe-eval'`.** Nenhum teste hoje impede alguém de alargar a diretiva; `apps/web/src/test/nginx-config.test.ts` só proíbe curinga. Mitigação: o teste passa a assertar que `'unsafe-eval'` puro nunca aparece.
- **Parâmetros medidos fora do navegador.** Os números acima vêm do Node, com o mesmo WebAssembly, mas não de um navegador nem de Android. O ADR 0018 trata disso e sai marcado como provisório.

## Impactos

- **Código:** `packages/crypto-web` implementa `KdfAdapter.deriveRootKey`; `CryptoAdapter` ganha `init()`.
- **Banco:** nenhum. Os parâmetros por usuário já estavam previstos em `ARCHITECTURE.md` secao 14.5.
- **API:** nenhum. `kdfParallelism: 1` já é o que `docs/API.md` documenta.
- **Segurança:** `apps/web/security-headers.conf` ganha `'wasm-unsafe-eval'`; `SECURITY.md` secao 50 registra a diretiva e mantém `'unsafe-eval'` vetado.
- **Deploy:** nenhuma variável nova. O bundle da Web cresce.
- **Documentação:** `ARCHITECTURE.md` secoes 3.6, 50 e 51; `DECISIONS.md` DEC-043 e PEND-001.

## Plano de migração

Não se aplica. Nenhum cofre existe, `packages/crypto-web` está vazio e nenhuma `RootKey` foi derivada.

Para uma troca futura de biblioteca, a igualdade de bytes medida entre libsodium, `hash-wasm` e `@noble/hashes` em `p=1` significa que a substituição não exige recriptografia, desde que o novo candidato passe os mesmos vetores. Trocar o **algoritmo**, ao contrário, continua exigindo nova `cryptoVersion`, leitor da versão anterior e migração explícita, conforme `ARCHITECTURE.md` secao 46.3.

## Referências internas

- `packages/crypto-core/src/adapters/crypto-adapters.ts` — `KdfAdapter`, `Argon2idParameters` e `CryptoAdapter`.
- `apps/web/security-headers.conf` — a CSP que ganha `'wasm-unsafe-eval'`.
- `apps/web/src/test/nginx-config.test.ts` — o teste que trava os cabeçalhos.
- `CLAUDE.md` secoes 8, 9, 59, 60 e 81 — modelo criptográfico, regras obrigatórias, checklist de dependências e procedimento de mudança de crypto.
- `SECURITY.md` secoes 8.2, 13, 22, 50 e 83 — força bruta, derivação, vetores, CSP e política de dependências.
- `ARCHITECTURE.md` secoes 3.6, 8.3, 14.3 e 43.3 — stack, fronteira do `crypto-web`, derivação e calibração.
- [ADR 0003](0003-client-side-encryption.md) — criptografia no cliente, que põe o custo do KDF no navegador.
- [ADR 0004](0004-auth-secret-domain-separation.md) — separação de domínio e parâmetros por usuário.
- [ADR 0017](0017-web-crypto-primitives.md) — as demais primitivas criptográficas da Web.
- [ADR 0018](0018-argon2id-parameters.md) — os parâmetros escolhidos.
