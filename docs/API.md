# API.md

# Crypta — Especificação da API

> **Status:** Documento inicial para revisão  
> **Versão:** 0.2.0  
> **Última atualização:** 8 de agosto de 2026

---

## 1. Objetivo

Este documento define os contratos da API REST do cofre de senhas.

A API será consumida por:

- aplicação Web;
- aplicativo Android;
- extensão de navegador futura;
- integração futura com preenchimento automático no Android.

Este documento deverá permanecer alinhado com:

- `PROJECT_SCOPE.md`;
- `ARCHITECTURE.md`;
- `DATABASE.md`;
- `SECURITY.md`;
- `TELAS.md`.

---

## 2. Princípios da API

A API deverá:

- ser REST;
- utilizar JSON;
- ser versionada;
- validar autenticação e autorização em todas as rotas protegidas;
- nunca confiar em permissões apenas do frontend;
- armazenar somente conteúdo sensível criptografado;
- não receber credenciais descriptografadas;
- retornar erros padronizados;
- suportar idempotência em operações críticas;
- usar controle de concorrência;
- registrar auditoria sem dados sensíveis;
- possuir documentação Swagger/OpenAPI.

---

## 3. Base URL

A API utiliza o mesmo contrato em todos os ambientes.

### Development

```text
https://api-crypta-dev.example.com/api/v1
```

Origem principal:

```text
develop
```

### Staging

```text
https://api-crypta-staging.example.com/api/v1
```

Origem principal:

```text
staging
```

Versão esperada:

```text
vX.Y.Z-rc.N
```

### Production

```text
https://api-crypta.example.com/api/v1
```

Origem principal:

```text
main
```

Versão esperada:

```text
vX.Y.Z
```

### Regras

- os três ambientes utilizam contratos compatíveis;
- cada ambiente possui banco, secrets e domínios próprios;
- development e staging não utilizam dados reais;
- URLs nunca devem ser hardcoded fora das variáveis de ambiente;
- produção deverá executar os mesmos digests homologados em staging;
- a versão implantada deverá ser verificável por `GET /version`.

Os domínios finais serão definidos em `config_user.md` e no Coolify.

## 4. Formato de conteúdo

### Request

```http
Content-Type: application/json
Accept: application/json
```

### Response

```http
Content-Type: application/json; charset=utf-8
```

### Codificação

Todos os textos deverão utilizar UTF-8.

---

## 5. Autenticação

### Access token

Rotas protegidas exigem:

```http
Authorization: Bearer <access_token>
```

O access token deverá possuir curta duração.

### Refresh token Web

O refresh token será enviado por cookie:

```http
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth
```

Os atributos estão fixados pelo [ADR 0021](decisions/0021-session-token-lifetimes.md):

- **sem atributo `Domain`** — cookie host-only, para que a sessão não trafegue entre ambientes;
- `SameSite=Strict` por padrão, configurável por `REFRESH_COOKIE_SAMESITE` apenas para deployments em que Web e API fiquem em domínios registráveis distintos;
- requisição que apresentar **mais de um** cookie `refresh_token` recebe `401`, sem que a API escolha entre os valores.

### Refresh token Android

No Android, o refresh token será retornado no corpo somente para o cliente móvel identificado e deverá ser armazenado no Android Keystore.

A implementação deverá diferenciar com segurança o fluxo Web do fluxo Mobile.

---

## 6. Headers comuns

### Request ID

O cliente poderá enviar:

```http
X-Request-Id: <uuid>
```

Se não enviar, a API deverá gerar.

A resposta deverá retornar:

```http
X-Request-Id: <uuid>
```

### Idempotency Key

Operações críticas poderão exigir:

```http
Idempotency-Key: <uuid>
```

### Client Type

Sugestão:

```http
X-Client-Type: web
```

Valores aceitos:

```text
web
android
extension
```

### Client Version

```http
X-Client-Version: 0.1.0
```

O cliente deverá informar sua própria versão, não a versão da API.

### Metadados do deployment

A API poderá retornar:

```http
X-App-Version: 0.4.0-rc.2
X-App-Commit: b85c091
X-App-Environment: staging
```

Esses headers:

- são informativos;
- não substituem `GET /version`;
- não devem conter hostname, secret, path interno ou detalhes da infraestrutura;
- devem ser gerados a partir dos metadados imutáveis do build.

## 7. Envelope de sucesso

### Objeto simples

```json
{
  "data": {
    "id": "018f0000-0000-7000-8000-000000000001"
  }
}
```

### Lista

```json
{
  "data": [],
  "meta": {
    "cursor": null,
    "hasMore": false
  }
}
```

### Sem conteúdo

Preferir:

```http
204 No Content
```

quando não houver corpo necessário.

---

## 8. Envelope de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Verifique os campos informados.",
    "requestId": "018f0000-0000-7000-8000-000000000999",
    "details": [
      {
        "field": "email",
        "code": "INVALID_EMAIL",
        "message": "Informe um e-mail válido."
      }
    ]
  }
}
```

### Regras

A resposta de erro não deverá incluir:

- stack trace;
- query SQL;
- segredo;
- token;
- cookie;
- senha;
- conteúdo descriptografado;
- chave;
- detalhes internos desnecessários.

---

## 9. Status HTTP

| Status | Uso                                       |
| -----: | ----------------------------------------- |
|  `200` | Consulta ou atualização concluída         |
|  `201` | Recurso criado                            |
|  `202` | Operação assíncrona ou pendente           |
|  `204` | Concluído sem corpo                       |
|  `400` | Request inválido                          |
|  `401` | Não autenticado                           |
|  `403` | Sem permissão                             |
|  `404` | Recurso não encontrado                    |
|  `409` | Conflito de versão, duplicidade ou estado |
|  `410` | Convite expirado ou recurso indisponível  |
|  `413` | Payload maior que o permitido             |
|  `415` | Formato não suportado                     |
|  `422` | Validação semântica                       |
|  `429` | Rate limit                                |
|  `500` | Erro inesperado                           |
|  `503` | Serviço indisponível                      |

---

## 10. Códigos de erro globais

```text
VALIDATION_ERROR
INVALID_REQUEST
UNAUTHORIZED
TOKEN_EXPIRED
TOKEN_INVALID
SESSION_REVOKED
SESSION_EXPIRED
ACCESS_DENIED
RESOURCE_NOT_FOUND
VERSION_CONFLICT
IDENTIFIER_CONFLICT
IDEMPOTENCY_CONFLICT
RATE_LIMIT_EXCEEDED
PAYLOAD_TOO_LARGE
SERVICE_UNAVAILABLE
INTERNAL_ERROR
```

---

## 11. Paginação

### Estratégia

Utilizar paginação por cursor.

### Query

```http
GET /resource?cursor=<cursor>&limit=50
```

### Limites

```text
default: 50
maximum: 100
```

### Response

```json
{
  "data": [],
  "meta": {
    "cursor": "next-cursor",
    "hasMore": true
  }
}
```

O cursor deverá ser opaco.

---

## 12. Ordenação

Quando suportada:

```http
?sort=updatedAt&order=desc
```

Valores permitidos deverão ser restritos por endpoint.

Nunca interpolar nomes de coluna recebidos diretamente.

---

## 13. Controle de concorrência

Recursos mutáveis utilizam `version`.

### Request

```json
{
  "expectedVersion": 3,
  "encryptedPayload": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  }
}
```

### Conflito

```http
409 Conflict
```

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "O registro foi alterado por outro usuário.",
    "requestId": "uuid",
    "details": [
      {
        "field": "expectedVersion",
        "code": "OUTDATED_VERSION"
      }
    ]
  }
}
```

---

## 14. Estrutura criptografada comum

### EncryptedPayload

```json
{
  "cryptoVersion": 1,
  "schemaVersion": 1,
  "algorithm": "XCHACHA20-POLY1305",
  "nonce": "base64url",
  "ciphertext": "base64url"
}
```

### Regras

- `nonce` obrigatório;
- `ciphertext` obrigatório;
- algoritmo permitido pela versão;
- limites de tamanho;
- base64url válido;
- API valida estrutura, não conteúdo descriptografado.

A validação estrutural é a de `parseCipherPayload`, em `@crypta/crypto-core`. A API usa a mesma função que os clientes: um formato aceito aqui e recusado lá seria um blob gravado que ninguém abre.

`cryptoVersion: 1` identifica o conjunto de algoritmos, incluindo a AAD `crypta-aad/v2` ([ADR 0023](decisions/0023-identity-aad-and-key-envelope.md)). A AAD não trafega — ela é reconstruída pelo cliente a partir do contexto da entidade, e é justamente por isso que amarra.

---

## 15. Estrutura de envelope de chave

```json
{
  "keyVersion": 1,
  "cryptoVersion": 1,
  "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
  "ephemeralPublicKey": "base64url",
  "encryptedVaultKey": "base64url"
}
```

### Regras

- `ephemeralPublicKey` tem exatamente 32 bytes decodificados;
- `encryptedVaultKey` precisa ser maior que a tag de 16 bytes;
- algoritmo permitido pela versão;
- validado por `parseKeyEnvelope`, em `@crypta/crypto-core`.

**Não existe campo `nonce`**, e a ausência é decisão, não omissão ([ADR 0023](decisions/0023-identity-aad-and-key-envelope.md)). O nonce é derivado do segredo compartilhado junto com a chave da AEAD; como o par efêmero é novo a cada envelope, ele nunca se repete. Transmiti-lo criaria uma segunda fonte de verdade, e um receptor que confiasse no valor recebido estaria aceitando um nonce escolhido por quem enviou.

O nome do algoritmo descreve a composição real, com o HKDF. A forma anterior deste documento dizia `X25519-XCHACHA20-POLY1305` e trazia um `nonce` que implementação nenhuma jamais produziu — o nome sugeria a família de sealed box que o [ADR 0017](decisions/0017-web-crypto-primitives.md) proibiu, e `parseKeyEnvelope` o recusa explicitamente.

---

# PARTE I — HEALTH, VERSÃO E SETUP

---

## 16. GET `/health/live`

### Objetivo

Verificar se o processo está ativo.

### Autenticação

Não.

### Response `200`

```json
{
  "data": {
    "status": "ok",
    "service": "crypta-api",
    "timestamp": "2026-07-31T18:00:00.000Z"
  }
}
```

O endpoint não deverá expor banco, hostname, secrets, stack ou versões detalhadas de dependências.

---

## 17. GET `/health/ready`

### Objetivo

Verificar se a API está pronta para receber tráfego.

### Verificações

- conexão com MySQL;
- migrations;
- dependências obrigatórias;
- configuração mínima do ambiente.

### Response `200`

```json
{
  "data": {
    "status": "ready",
    "database": "ok"
  }
}
```

### Response `503`

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "O serviço ainda não está disponível.",
    "requestId": "uuid",
    "details": []
  }
}
```

---

## 18. GET `/version`

### Objetivo

Identificar com precisão o artefato implantado.

### Autenticação

Não.

### Cache

```http
Cache-Control: no-store
```

### Response `200`

Development:

```json
{
  "data": {
    "service": "crypta-api",
    "version": "0.4.0-dev",
    "commit": "b85c091",
    "environment": "development",
    "builtAt": "2026-07-31T18:00:00.000Z"
  }
}
```

Staging:

```json
{
  "data": {
    "service": "crypta-api",
    "version": "0.4.0-rc.2",
    "commit": "b85c091",
    "environment": "staging",
    "builtAt": "2026-07-31T18:00:00.000Z"
  }
}
```

Production:

```json
{
  "data": {
    "service": "crypta-api",
    "version": "0.4.0",
    "commit": "b85c091",
    "environment": "production",
    "builtAt": "2026-07-31T18:00:00.000Z"
  }
}
```

### Fonte dos valores

Os dados deverão ser injetados no build:

```text
APP_VERSION
APP_COMMIT
APP_ENVIRONMENT
APP_BUILT_AT
```

### Regras

- não consultar o GitHub durante a request;
- não executar comandos Git em runtime;
- não retornar branch, token ou identificador do Coolify;
- `commit` deverá identificar o código utilizado no build;
- `environment` aceitará somente `development`, `staging` ou `production`;
- a response deverá ser validada após cada deployment;
- staging e production deverão corresponder ao `release-manifest.json`.

---

## 19. GET `/setup/status`

### Objetivo

Informar se o primeiro usuário precisa ser criado.

### Autenticação

Não.

### Response

```json
{
  "data": {
    "setupRequired": true
  }
}
```

### Segurança

Não retornar quantidade de usuários ou detalhes internos.

---

## 20. POST `/setup`

### Objetivo

Criar o primeiro usuário.

### Autenticação

Não, somente enquanto `setupRequired = true`.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "name": "Usuário inicial",
  "email": "owner@example.test",
  "authSecret": "base64url",
  "keyBundle": {
    "kdfAlgorithm": "ARGON2ID",
    "kdfVersion": 1,
    "kdfSalt": "base64url",
    "kdfMemory": 65536,
    "kdfIterations": 3,
    "kdfParallelism": 1,
    "publicKey": "base64url",
    "encryptedPrivateKey": "base64url",
    "privateKeyNonce": "base64url",
    "cryptoVersion": 1,
    "schemaVersion": 1
  }
}
```

### Response `201`

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Usuário inicial",
      "email": "owner@example.test"
    },
    "accessToken": "token",
    "expiresIn": 900
  }
}
```

### Validação do key bundle

`INVALID_KEY_BUNDLE` é o que `parseUserKeyBundle`, de `@crypta/crypto-core`, recusa: salt fora de 16 bytes, chave pública fora de 32, nonce fora de 24, versão criptográfica não suportada ou algoritmo de KDF desconhecido.

A API valida **estrutura**, nunca conteúdo. Ela não tem como conferir que `encryptedPrivateKey` de fato contém a chave privada correspondente a `publicKey` — quem confere isso é o cliente, no primeiro desbloqueio, porque a AAD do escopo `user` amarra o ciphertext à chave pública ([ADR 0023](decisions/0023-identity-aad-and-key-envelope.md)).

O DTO aceita apenas os campos acima. Um `privateKey` em texto aberto no corpo é recusado com `400`, e não silenciosamente ignorado.

### Erros

```text
SETUP_ALREADY_COMPLETED
INVALID_KDF_PARAMETERS
INVALID_KEY_BUNDLE
IDEMPOTENCY_CONFLICT
```

---

# PARTE II — AUTENTICAÇÃO

---

## 21. GET `/auth/parameters`

### Objetivo

Retornar parâmetros necessários para derivação no cliente.

### Query

```http
GET /auth/parameters?email=owner@example.test
```

### Response

```json
{
  "data": {
    "kdfAlgorithm": "ARGON2ID",
    "kdfVersion": 1,
    "kdfSalt": "base64url",
    "kdfMemory": 65536,
    "kdfIterations": 3,
    "kdfParallelism": 1
  }
}
```

### Segurança

Para e-mail inexistente, retornar parâmetros sintéticos válidos.

Os parâmetros sintéticos precisam ser **estáveis por e-mail**. Sorteá-los a cada requisição faria duas consultas ao mesmo endereço devolverem `kdfSalt` diferente, e a instabilidade seria por si só o oráculo de enumeração que esta secao existe para fechar. Pelo [ADR 0022](decisions/0022-server-side-credentials.md) eles são derivados do e-mail normalizado com um segredo do servidor — `HKDF-SHA-256(AUTH_SERVER_SECRET, info="kdf-parameters-decoy")` — o que os torna determinísticos sem os tornar previsíveis.

A resposta não deve revelar se a conta existe.

### Rate limit

Obrigatório. `AUTH_IP_RATE_LIMIT` requisições por minuto por IP, padrão 60, pelo [ADR 0022](decisions/0022-server-side-credentials.md).

---

## 22. POST `/auth/login`

### Objetivo

Autenticar usuário com `AuthSecret`.

### Request Web

```json
{
  "email": "owner@example.test",
  "authSecret": "base64url",
  "client": {
    "type": "web",
    "name": "Firefox no Windows"
  }
}
```

### Request Android

```json
{
  "email": "owner@example.test",
  "authSecret": "base64url",
  "client": {
    "type": "android",
    "name": "Android"
  }
}
```

### Response Web `200`

```json
{
  "data": {
    "accessToken": "token",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "name": "Usuário",
      "email": "owner@example.test"
    }
  }
}
```

O refresh token é enviado em cookie.

### Response Android `200`

```json
{
  "data": {
    "accessToken": "token",
    "refreshToken": "opaque-token",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "name": "Usuário",
      "email": "owner@example.test"
    }
  }
}
```

### Erros

```text
INVALID_CREDENTIALS
RATE_LIMIT_EXCEEDED
```

Somente estes dois quando a autenticação **não** teve sucesso.

`ACCOUNT_DISABLED` e `ACCOUNT_LOCKED` existem, mas só são devolvidos quando o `AuthSecret` **confere** e o acesso é negado mesmo assim. Antes disso a resposta é sempre `INVALID_CREDENTIALS`, independentemente de a conta existir, estar bloqueada ou desativada.

O motivo está no [ADR 0022](decisions/0022-server-side-credentials.md): devolver `ACCOUNT_LOCKED` a quem errou a senha revela que o e-mail está cadastrado, e enumerar a base vira questão de tempo — contra `SECURITY.md` secao 25, que está acima deste documento na hierarquia do `CLAUDE.md` secao 2. Condicionar a revelação à verificação bem-sucedida entrega a informação a quem já provou ter a senha, e a mais ninguém.

Duas consequências para a implementação: o bloqueio é verificado **depois** do cálculo do verificador, e e-mail inexistente executa um HMAC descartável de mesmo custo — do contrário o tempo de resposta separa os casos que os códigos igualaram.

### Mensagem pública

```text
E-mail ou senha inválidos.
```

### Rate limit

Por IP, `AUTH_IP_RATE_LIMIT` por minuto. Por conta, bloqueio progressivo conforme `SECURITY.md` secao 26.

---

## 23. POST `/auth/refresh`

### Objetivo

Rotacionar o refresh token e emitir novo access token.

### Request Web

Sem corpo obrigatório. Token recebido via cookie.

### Request Android

```json
{
  "refreshToken": "opaque-token"
}
```

### Response

```json
{
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token-only-mobile",
    "expiresIn": 900
  }
}
```

### Erros

```text
REFRESH_TOKEN_INVALID
REFRESH_TOKEN_EXPIRED
REFRESH_TOKEN_REUSED
SESSION_REVOKED
```

### Janela de tolerância

Um refresh token rotacionado há 10 segundos ou menos é aceito, e a sessão continua de pé. Existe para que duas abas renovando ao mesmo tempo não sejam tratadas como reutilização (ADR 0021).

**O par devolvido é novo**, e não o que a rotação original emitiu ([ADR 0024](decisions/0024-rotation-grace-window.md)). Repetir o par exigiria guardar o refresh token em texto aberto, o que anularia o hash em repouso e faria um dump do banco entregar sessões utilizáveis. A rotação dentro da janela **não estende** o limite de inatividade.

### Reutilização

Fora da janela, apresentar um token já rotacionado é reutilização:

- revogar a **família inteira**, não apenas a sessão;
- retornar `401 SESSION_REVOKED`;
- limpar o cookie de refresh;
- registrar auditoria.

### Cookie duplicado

Requisição que apresente mais de um cookie `refresh_token` recebe `401`, sem que a API escolha entre os valores. A ordem não é garantida por especificação, e um subdomínio irmão comprometido pode gravar um cookie de mesmo nome com escopo mais amplo (ADR 0021).

A sessão **não** é revogada nesse caso: a requisição é que está ambígua, não a credencial.

---

## 24. POST `/auth/logout`

### Objetivo

Encerrar a sessão atual.

### Autenticação

Sim.

### Request Android

```json
{
  "refreshToken": "opaque-token"
}
```

### Response

```http
204 No Content
```

---

## 25. POST `/auth/logout-all`

### Objetivo

Revogar todas as sessões do usuário.

### Autenticação

Sim.

### Request

```json
{
  "currentSessionIncluded": true
}
```

### Response

```http
204 No Content
```

---

# PARTE III — USUÁRIO E CHAVES

---

## 26. GET `/users/me`

### Objetivo

Retornar perfil atual.

### Response

```json
{
  "data": {
    "id": "uuid",
    "name": "Usuário",
    "email": "owner@example.test",
    "status": "ACTIVE",
    "createdAt": "2026-07-30T22:00:00.000Z"
  }
}
```

---

## 27. PATCH `/users/me`

### Objetivo

Atualizar dados permitidos do perfil.

### Request

```json
{
  "name": "Novo nome"
}
```

### Response

```json
{
  "data": {
    "id": "uuid",
    "name": "Novo nome",
    "email": "owner@example.test",
    "updatedAt": "2026-07-30T22:10:00.000Z"
  }
}
```

---

## 28. GET `/users/me/key-bundle`

### Objetivo

Retornar o bundle criptográfico do usuário.

### Response

```json
{
  "data": {
    "kdfAlgorithm": "ARGON2ID",
    "kdfVersion": 1,
    "kdfSalt": "base64url",
    "kdfMemory": 65536,
    "kdfIterations": 3,
    "kdfParallelism": 1,
    "publicKey": "base64url",
    "encryptedPrivateKey": "base64url",
    "privateKeyNonce": "base64url",
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "updatedAt": "2026-07-30T22:00:00.000Z"
  }
}
```

---

## 29. POST `/users/me/change-password`

### Objetivo

Atualizar segredo autenticador e recriptografar a chave privada.

### Request

```json
{
  "currentAuthSecret": "base64url",
  "newAuthSecret": "base64url",
  "newKeyBundle": {
    "kdfAlgorithm": "ARGON2ID",
    "kdfVersion": 1,
    "kdfSalt": "base64url",
    "kdfMemory": 65536,
    "kdfIterations": 3,
    "kdfParallelism": 1,
    "publicKey": "base64url",
    "encryptedPrivateKey": "base64url",
    "privateKeyNonce": "base64url",
    "cryptoVersion": 1,
    "schemaVersion": 1
  },
  "revokeOtherSessions": true
}
```

### Response

```http
204 No Content
```

`revokeOtherSessions` é opcional e vale `true` por omissão. O caso normal de troca de senha é o de quem suspeita que alguém mais tem acesso, e manter as demais sessões vivas por padrão contrariaria o motivo da troca.

A sessão que faz a chamada **sempre** sobrevive. Derrubá-la junto transformaria a operação bem-sucedida em aparência de falha.

### Regras

- a chave pública precisa permanecer **exatamente** igual;
- o `kdfSalt` precisa ser diferente do atual;
- o `currentAuthSecret` é validado antes de qualquer escrita;
- as duas escritas e a revogação acontecem na mesma transação;
- um bloqueio por tentativas em curso é zerado.

### Por que a chave pública é imutável aqui

Ela é o endereço para o qual todo `VaultKeyEnvelope` existente foi selado. Aceitar uma nova tornaria ilegível todo cofre que o usuário tem ou que compartilharam com ele, e o estrago apareceria apenas na próxima abertura — depois do commit. Trocar o par é outra operação, que a V1 não tem ([SECURITY.md](../SECURITY.md) secao 28).

O cliente reprotege o **mesmo** par com a `UserEncryptionKey` nova, por `resealUserKeyBundle` em `@crypta/crypto-core`. Formato, AAD e versões são idênticos aos de `POST /setup`: é um segundo escritor, não um formato novo.

### Por que o salt precisa mudar

Mantê-lo faria a senha nova derivar sob o mesmo material da antiga, e qualquer trabalho pré-computado contra aquele salt continuaria valendo. Custo e paralelismo, ao contrário, são preservados: recalibrá-los é decisão do [ADR 0018](decisions/0018-argon2id-parameters.md), não efeito colateral de trocar a senha.

### Por que exigir o `AuthSecret` atual

[SECURITY.md](../SECURITY.md) secao 27 proíbe alterar a senha apenas com um access token. Um token roubado dá a sessão; deixá-lo trocar a senha daria a conta, e o dono perderia o acesso sem ter errado nada. O `currentAuthSecret` é a confirmação adicional que a regra exige.

### Erros

```text
CURRENT_CREDENTIAL_INVALID    401 — senha atual errada
PUBLIC_KEY_CHANGE_NOT_ALLOWED 409 — o bundle novo traz outra chave pública
INVALID_KEY_BUNDLE            400 — salt reaproveitado, ou bundle atual ausente
ACCOUNT_DISABLED              401 — conta inativa
```

`CURRENT_CREDENTIAL_INVALID` é distinto de `INVALID_CREDENTIALS`: aqui não há oráculo de enumeração a evitar, porque quem chama já está autenticado e a conta é a dele.

---

# PARTE IV — SESSÕES

---

## 30. GET `/sessions`

### Objetivo

Listar sessões do usuário.

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "clientType": "web",
      "clientName": null,
      "ipAddress": "192.0.2.10",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) …",
      "createdAt": "2026-07-30T22:00:00.000Z",
      "lastUsedAt": "2026-07-30T22:00:00.000Z",
      "isCurrent": true
    }
  ]
}
```

O tipo é `SessionView`, em `@crypta/contracts`.

### Por que não há `expiresAt` nem `status`

Sessão revogada é **apagada**, não marcada ([ADR 0020](decisions/0020-deletion-policy.md)): toda linha desta lista está viva, e uma coluna `status` só poderia repetir isso.

A expiração é derivada de duas âncoras — `createdAt` mais o teto absoluto e `lastUsedAt` mais a inatividade ([ADR 0021](decisions/0021-session-token-lifetimes.md)). Um `expiresAt` materializado seria uma terceira fonte de verdade, capaz de discordar das outras duas depois de qualquer mudança de configuração.

### Por que `userAgent` cru, e não `deviceName` e `platform`

Interpretar o `User-Agent` é decisão de apresentação, e o servidor não a toma em nome de nenhum cliente. A Web deriva navegador e sistema em `describe-session.ts`; o Android exibirá o que fizer sentido lá.

`clientName`, `ipAddress` e `userAgent` vêm do cliente e **não são confiáveis** — nenhum participa de decisão de autorização. Existem para o dono reconhecer o que revogar.

### Segurança

Não retornar refresh token ou hash.

---

## 31. DELETE `/sessions/:sessionId`

### Objetivo

Revogar uma sessão específica.

### Response

```http
204 No Content
```

### Erros

```text
SESSION_NOT_FOUND
SESSION_ALREADY_REVOKED
```

---

## 32. DELETE `/sessions`

### Objetivo

Revogar todas as outras sessões. A que fez a chamada permanece.

### Query

Nenhuma. A rota **sempre** preserva a sessão atual, e não aceita parâmetro para mudar isso.

O `?keepCurrent=true` que esta secao documentava antes nunca foi implementado, e não deve ser: um parâmetro cujo único valor aceito é o padrão convida a mandar `false` e receber comportamento que não existe. Para derrubar a própria sessão junto das demais, use `POST /auth/logout-all`, que é explícito sobre isso.

### Response

```http
204 No Content
```

---

# PARTE V — COFRES

---

## 33. GET `/vaults`

### Objetivo

Listar cofres acessíveis.

### Query

```text
cursor
limit
type=all|private|shared
sort=updatedAt
order=asc|desc
```

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "encryptedMetadata": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "currentUserEnvelope": {
        "keyVersion": 1,
        "cryptoVersion": 1,
        "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
        "ephemeralPublicKey": "base64url",
        "encryptedVaultKey": "base64url"
      },
      "role": "OWNER",
      "memberCount": 1,
      "siteCount": 3,
      "version": 1,
      "keyVersion": 1,
      "updatedAt": "2026-07-30T22:00:00.000Z"
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false
  }
}
```

### Observação

A API conhece contagens, mas não nomes.

### Por que o envelope vem na listagem

Sem ele o dashboard não teria como exibir nome nenhum: a metadata é cifrada com a `VaultKey`, e a `VaultKey` só sai do envelope. A alternativa seria a Web pedir um snapshot por cofre só para descobrir os nomes — uma requisição por linha da lista.

Vem apenas o envelope **do próprio chamador**, na geração corrente da chave, e o filtro é do banco. O de outro membro continua fora daqui e do snapshot: ele não daria acesso a nada, por ser selado para outra chave pública, mas entregaria o mapa de quem acessa o quê.

---

## 34. POST `/vaults`

### Objetivo

Criar cofre privado.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "id": "uuid-v7",
  "encryptedMetadata": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  },
  "ownerEnvelope": {
    "keyVersion": 1,
    "cryptoVersion": 1,
    "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
    "ephemeralPublicKey": "base64url",
    "encryptedVaultKey": "base64url"
  }
}
```

### Response `201`

```json
{
  "data": {
    "id": "uuid",
    "role": "OWNER",
    "version": 1,
    "keyVersion": 1,
    "createdAt": "2026-07-30T22:00:00.000Z"
  }
}
```

### O `id` vem do cliente

É a exceção do [ADR 0025](decisions/0025-client-generated-identifiers.md), e não uma conveniência: a AAD de `encryptedMetadata` amarra ao id do cofre, e o cliente cifra antes desta requisição. Um id gerado aqui produziria metadata que ninguém consegue abrir.

A API valida e não corrige. Precisa ser UUIDv7 — id ausente, malformado ou de outra versão é `400 VALIDATION_ERROR`; id já usado é `409 IDENTIFIER_CONFLICT`, e o cliente refaz com outro.

### Validação estrutural

`encryptedMetadata` segue a secao 14 e é validado por `parseCipherPayload`; `ownerEnvelope` segue a secao 15 e é validado por `parseKeyEnvelope`. As duas funções vêm de `@crypta/crypto-core`, as mesmas que o cliente usa para produzir os campos.

Um envelope com campo `nonce` é **recusado**, e a recusa é a decisão do [ADR 0023](decisions/0023-identity-aad-and-key-envelope.md): o nonce é derivado do segredo compartilhado junto com a chave da AEAD e não trafega. Aceitar um nonce escolhido por quem envia seria aceitar uma segunda fonte de verdade.

A API valida a estrutura e nunca o conteúdo. Ela não recebe, não deriva e não guarda a `VaultKey` — o envelope chega pronto do cliente, cifrado para a chave pública do proprietário.

### Erros

```text
VALIDATION_ERROR
IDENTIFIER_CONFLICT
VAULT_LIMIT_REACHED
INVALID_ENVELOPE
IDEMPOTENCY_CONFLICT
```

---

## 35. GET `/vaults/:vaultId`

### Objetivo

Retornar metadados estruturais do cofre.

### Response

```json
{
  "data": {
    "id": "uuid",
    "encryptedMetadata": {
      "cryptoVersion": 1,
      "schemaVersion": 1,
      "algorithm": "XCHACHA20-POLY1305",
      "nonce": "base64url",
      "ciphertext": "base64url"
    },
    "role": "EDITOR",
    "memberCount": 2,
    "siteCount": 3,
    "version": 2,
    "keyVersion": 1,
    "isLockedForRekey": false,
    "createdAt": "2026-07-30T22:00:00.000Z",
    "updatedAt": "2026-07-30T22:20:00.000Z"
  }
}
```

---

## 36. PATCH `/vaults/:vaultId`

### Objetivo

Atualizar metadados criptografados do cofre.

### Permissão

OWNER.

### Request

```json
{
  "expectedVersion": 2,
  "encryptedMetadata": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  }
}
```

### Response

```json
{
  "data": {
    "id": "uuid",
    "version": 3,
    "updatedAt": "2026-07-30T22:30:00.000Z"
  }
}
```

---

## 37. DELETE `/vaults/:vaultId`

### Objetivo

Excluir o cofre.

### Permissão

OWNER.

### Request

```json
{
  "expectedVersion": 3,
  "confirmation": true
}
```

### Response

```http
204 No Content
```

### Erros

```text
VAULT_ACCESS_DENIED
VAULT_LOCKED_FOR_REKEY
VERSION_CONFLICT
```

---

## 38. GET `/vaults/:vaultId/snapshot`

### Objetivo

Retornar snapshot criptografado do cofre.

### Response

```json
{
  "data": {
    "vault": {
      "id": "uuid",
      "encryptedMetadata": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "version": 1,
      "keyVersion": 1
    },
    "currentUserEnvelope": {
      "keyVersion": 1,
      "cryptoVersion": 1,
      "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
      "ephemeralPublicKey": "base64url",
      "encryptedVaultKey": "base64url"
    },
    "sites": [],
    "credentials": [],
    "members": [],
    "syncCursor": "opaque-cursor"
  }
}
```

### Regras

- apenas membro ativo;
- retornar somente envelope do usuário atual;
- não retornar envelopes de outros usuários;
- cofre em rekey poderá restringir mutações.

---

## 39. GET `/vaults/:vaultId/changes`

### Objetivo

Sincronização incremental futura ou opcional.

### Query

```http
GET /vaults/:vaultId/changes?cursor=<cursor>&limit=100
```

### Response

```json
{
  "data": [
    {
      "entityType": "CREDENTIAL",
      "entityId": "uuid",
      "operation": "UPDATE",
      "version": 4,
      "encryptedPayload": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "occurredAt": "2026-07-30T22:30:00.000Z"
    }
  ],
  "meta": {
    "cursor": "next-cursor",
    "hasMore": false
  }
}
```

### Status

Opcional na primeira versão.

---

# PARTE VI — MEMBROS

---

## 40. GET `/vaults/:vaultId/members`

### Objetivo

Listar membros e respectivos papéis.

### Permissão

OWNER para gerenciamento.

Membros poderão receber lista limitada caso necessário para interface.

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Usuário",
        "email": "user@example.test"
      },
      "role": "OWNER",
      "status": "ACTIVE",
      "joinedAt": "2026-07-30T22:00:00.000Z"
    }
  ]
}
```

---

## 41. PATCH `/vaults/:vaultId/members/:memberId`

### Objetivo

Alterar papel de membro.

### Permissão

OWNER.

### V1

Como existe apenas EDITOR além de OWNER, este endpoint poderá ser reservado para evolução futura.

### Request

```json
{
  "role": "EDITOR"
}
```

---

## 42. DELETE `/vaults/:vaultId/members/:memberId`

### Objetivo

Iniciar remoção de membro.

### Permissão

OWNER.

### Request

```json
{
  "reason": "ACCESS_REVOKED"
}
```

### Response `202`

```json
{
  "data": {
    "rekeyRequired": true,
    "rekeyId": "uuid",
    "status": "PENDING"
  }
}
```

### Regra

A remoção efetiva requer rekey.

---

## 43. POST `/vaults/:vaultId/leave`

### Objetivo

Permitir que EDITOR saia do cofre.

### Request

```json
{
  "confirmation": true
}
```

### Response

```http
204 No Content
```

### Erros

```text
OWNER_CANNOT_LEAVE
MEMBERSHIP_NOT_ACTIVE
```

---

# PARTE VII — CONVITES

---

## 44. GET `/invitations`

### Objetivo

Listar convites recebidos pelo usuário autenticado.

### Query

```text
status=PENDING|ACCEPTED|DECLINED|CANCELLED|EXPIRED
cursor
limit
```

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "vaultId": "uuid",
      "encryptedVaultMetadata": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "invitedEmail": "user@example.test",
      "role": "EDITOR",
      "status": "PENDING",
      "createdBy": {
        "id": "uuid",
        "name": "Owner"
      },
      "expiresAt": "2026-08-06T22:00:00.000Z",
      "createdAt": "2026-07-30T22:00:00.000Z"
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false
  }
}
```

---

## 45. POST `/vaults/:vaultId/invitations`

### Objetivo

Criar convite.

### Permissão

OWNER.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "email": "user@example.test",
  "role": "EDITOR",
  "tokenHash": "base64url",
  "encryptedVaultKey": "base64url",
  "nonce": "base64url",
  "cryptoVersion": 1,
  "expiresAt": "2026-08-06T22:00:00.000Z"
}
```

### Response `201`

```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "expiresAt": "2026-08-06T22:00:00.000Z"
  }
}
```

### Observação

A API não recebe `inviteSecret`.

### Erros

```text
INVITATION_ALREADY_PENDING
USER_ALREADY_MEMBER
INVALID_INVITATION_ROLE
INVITATION_LIMIT_REACHED
```

---

## 46. GET `/vaults/:vaultId/invitations`

### Objetivo

Listar convites emitidos para um cofre.

### Permissão

OWNER.

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.test",
      "role": "EDITOR",
      "status": "PENDING",
      "expiresAt": "2026-08-06T22:00:00.000Z",
      "createdAt": "2026-07-30T22:00:00.000Z"
    }
  ]
}
```

---

## 47. GET `/invitations/by-token/:token`

### Objetivo

Consultar convite por token público.

### Autenticação

Opcional.

### Segurança

A API deverá hashear o token recebido antes da consulta.

### Response

```json
{
  "data": {
    "id": "uuid",
    "vaultId": "uuid",
    "invitedEmail": "user@example.test",
    "role": "EDITOR",
    "status": "PENDING",
    "encryptedVaultKey": "base64url",
    "nonce": "base64url",
    "cryptoVersion": 1,
    "expiresAt": "2026-08-06T22:00:00.000Z",
    "requiresAccount": true
  }
}
```

### Erros

```text
INVITATION_NOT_FOUND
INVITATION_EXPIRED
INVITATION_CANCELLED
INVITATION_ALREADY_USED
```

---

## 48. POST `/invitations/:invitationId/accept`

### Objetivo

Aceitar convite e criar membership/envelope.

### Autenticação

Sim.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "token": "opaque-token",
  "memberEnvelope": {
    "keyVersion": 1,
    "cryptoVersion": 1,
    "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
    "ephemeralPublicKey": "base64url",
    "encryptedVaultKey": "base64url"
  }
}
```

### Response `201`

```json
{
  "data": {
    "vaultId": "uuid",
    "membershipId": "uuid",
    "role": "EDITOR",
    "status": "ACTIVE"
  }
}
```

### Erros

```text
INVITATION_EMAIL_MISMATCH
INVITATION_EXPIRED
INVITATION_ALREADY_USED
INVALID_MEMBER_ENVELOPE
```

---

## 49. POST `/invitations/:invitationId/decline`

### Objetivo

Recusar convite.

### Request

```json
{
  "token": "opaque-token"
}
```

### Response

```http
204 No Content
```

---

## 50. DELETE `/vaults/:vaultId/invitations/:invitationId`

### Objetivo

Cancelar convite.

### Permissão

OWNER.

### Response

```http
204 No Content
```

---

# PARTE VIII — SITES

---

## 51. GET `/vaults/:vaultId/sites`

### Objetivo

Listar sites criptografados do cofre.

### Permissão

Membro ativo do cofre — OWNER ou EDITOR. Cofre de que o chamador não participa responde `404`, nunca `403`, pela regra da secao 35.

### Query

```text
cursor
limit
updatedAfter
```

Paginação por cursor, conforme a secao 11: `limit` tem padrão `50` e máximo `100`, e o cursor é opaco. `updatedAfter` aceita um timestamp ISO-8601 em UTC e restringe o resultado às linhas alteradas depois dele.

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "vaultId": "uuid",
      "encryptedPayload": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "credentialCount": 2,
      "keyVersion": 1,
      "version": 1,
      "createdAt": "2026-07-30T22:00:00.000Z",
      "updatedAt": "2026-07-30T22:00:00.000Z"
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false
  }
}
```

### Observação

`credentialCount` é contagem, não conteúdo: vale a mesma regra da secao 33 — a API conhece quantidades e não conhece nomes.

---

## 52. POST `/vaults/:vaultId/sites`

### Objetivo

Criar site.

### Permissão

OWNER ou EDITOR.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "id": "uuid-v7",
  "encryptedPayload": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  },
  "keyVersion": 1
}
```

### O `id` vem do cliente

Pela mesma razão da secao 34, e sob o mesmo [ADR 0025](decisions/0025-client-generated-identifiers.md): a AAD de `encryptedPayload` amarra ao id do site, e o cliente cifra antes desta requisição. Um id gerado aqui produziria payload que ninguém consegue abrir.

A API valida e não corrige. Precisa ser UUIDv7 — id ausente, malformado ou de outra versão é `400 VALIDATION_ERROR`; id já usado é `409 IDENTIFIER_CONFLICT`, e o cliente refaz com outro.

### Validação estrutural

`encryptedPayload` segue a secao 14 e é validado por `parseCipherPayload`, de `@crypta/crypto-core` — a mesma função que o cliente usa para produzir o campo. A API valida a forma e nunca o conteúdo: ela não recebe, não deriva e não guarda a `VaultKey`.

`keyVersion` declara a geração da `VaultKey` usada para cifrar. Precisa ser igual à `key_version` corrente do cofre; divergência é `409 KEY_VERSION_MISMATCH`, e o cliente recarrega o envelope antes de tentar de novo. É o que impede gravar conteúdo cifrado com uma chave que um rekey já aposentou.

#### A mesma condição hoje tem duas formas

Na criação de cofre a checagem já existe e responde diferente: `create-vault.service.ts` lança `InvalidEnvelopeException('KEY_VERSION_MISMATCH')`, que é `400 INVALID_ENVELOPE` com `KEY_VERSION_MISMATCH` em `details[].code`. Ali o campo conferido é o envelope, e o código descreve o envelope.

Nas rotas de conteúdo não existe envelope — `keyVersion` é campo do próprio payload — então `INVALID_ENVELOPE` não serve, e o código sobe para o topo como `409`. `409` e não `400` porque o cliente não enviou nada malformado: ele enviou algo que era válido até um rekey mudar a geração, e a saída é recarregar e repetir, igual ao `VERSION_CONFLICT`.

As duas formas convivem porque descrevem coisas diferentes. O que **não** pode acontecer é a rota de conteúdo herdar `INVALID_ENVELOPE` por cópia.

### Response `201`

```json
{
  "data": {
    "id": "uuid",
    "vaultId": "uuid",
    "keyVersion": 1,
    "version": 1,
    "createdAt": "2026-07-30T22:00:00.000Z"
  }
}
```

### Erros

```text
VALIDATION_ERROR
IDENTIFIER_CONFLICT
VAULT_LOCKED_FOR_REKEY
SITE_LIMIT_REACHED
KEY_VERSION_MISMATCH
IDEMPOTENCY_CONFLICT
```

---

## 53. GET `/vaults/:vaultId/sites/:siteId`

### Objetivo

Retornar site criptografado.

### Permissão

Membro ativo do cofre. Site de outro cofre — inclusive de outro cofre do próprio chamador — responde `404`: o par `vaultId`/`siteId` é validado em conjunto, e não apenas o `siteId`.

### Response

```json
{
  "data": {
    "id": "uuid",
    "vaultId": "uuid",
    "encryptedPayload": {
      "cryptoVersion": 1,
      "schemaVersion": 1,
      "algorithm": "XCHACHA20-POLY1305",
      "nonce": "base64url",
      "ciphertext": "base64url"
    },
    "credentialCount": 2,
    "keyVersion": 1,
    "version": 1,
    "createdBy": {
      "id": "uuid",
      "name": "Nome de Perfil"
    },
    "updatedBy": {
      "id": "uuid",
      "name": "Nome de Perfil"
    },
    "createdAt": "2026-07-30T22:00:00.000Z",
    "updatedAt": "2026-07-30T22:00:00.000Z"
  }
}
```

`createdBy` e `updatedBy` carregam o nome de perfil do usuário, que o banco guarda em texto aberto por decisão explícita (`DATABASE.md` secao 4). Eles não aparecem na listagem da secao 51: a lista existe para desenhar a tela do cofre e não precisa de autoria por linha. Em cofre privado os dois são sempre o próprio chamador; o campo passa a informar algo a partir da R0.5.

---

## 54. PATCH `/vaults/:vaultId/sites/:siteId`

### Objetivo

Atualizar site.

### Permissão

OWNER ou EDITOR.

### Request

```json
{
  "expectedVersion": 1,
  "encryptedPayload": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  },
  "keyVersion": 1
}
```

`expectedVersion` segue a secao 13: a condição entra no `WHERE` da atualização, e não em uma checagem prévia em memória. Versão defasada é `409 VERSION_CONFLICT` **sem gravar**.

### Response

```json
{
  "data": {
    "id": "uuid",
    "version": 2,
    "updatedAt": "2026-07-30T22:10:00.000Z"
  }
}
```

### Erros

```text
VALIDATION_ERROR
VERSION_CONFLICT
KEY_VERSION_MISMATCH
VAULT_LOCKED_FOR_REKEY
```

---

## 55. DELETE `/vaults/:vaultId/sites/:siteId`

### Objetivo

Excluir site e credenciais relacionadas.

### Permissão

OWNER ou EDITOR.

### Request

```json
{
  "expectedVersion": 2,
  "confirmation": true
}
```

`expectedVersion` é a do **site**. As credenciais são removidas junto sem que suas versões sejam conferidas uma a uma: a confirmação é sobre o site, e o aviso do W12 (`TELAS.md` secao 17) diz exatamente isso ao usuário.

### Exclusão em cascata

A remoção é física, sem `deleted_at`, e vale para o site e para todas as suas credenciais ([ADR 0020](decisions/0020-deletion-policy.md)). O `ON DELETE CASCADE` de `credentials` → `sites` está declarado em `DATABASE.md`.

A operação é transacional, e os registros de auditoria sobrevivem às linhas apagadas — `audit_logs` não tem chave estrangeira para elas, que é a razão de a exclusão física se sustentar.

### Response

```http
204 No Content
```

### Erros

```text
VERSION_CONFLICT
VAULT_LOCKED_FOR_REKEY
VAULT_ACCESS_DENIED
```

---

# PARTE IX — CREDENCIAIS

---

## 56. GET `/vaults/:vaultId/sites/:siteId/credentials`

### Objetivo

Listar credenciais criptografadas de um site.

### Permissão

Membro ativo do cofre.

### Query

```text
cursor
limit
updatedAfter
```

Mesma paginação da secao 51 e da secao 11: `limit` com padrão `50` e máximo `100`, cursor opaco. Um site pode chegar a `MAX_CREDENTIALS_PER_SITE` credenciais (secao 74), então a lista pagina de verdade — não é um caso em que a coleção sempre cabe em uma resposta.

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "vaultId": "uuid",
      "siteId": "uuid",
      "encryptedPayload": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "keyVersion": 1,
      "version": 1,
      "createdAt": "2026-07-30T22:00:00.000Z",
      "updatedAt": "2026-07-30T22:00:00.000Z"
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false
  }
}
```

---

## 57. POST `/vaults/:vaultId/sites/:siteId/credentials`

### Objetivo

Criar credencial.

### Permissão

OWNER ou EDITOR.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "id": "uuid-v7",
  "encryptedPayload": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  },
  "keyVersion": 1
}
```

### O `id` vem do cliente

Como na secao 52, e pelo [ADR 0025](decisions/0025-client-generated-identifiers.md): a AAD amarra ao id da credencial, cunhado antes de cifrar. Mesmas regras de validação — `400 VALIDATION_ERROR` para id ausente ou fora do UUIDv7, `409 IDENTIFIER_CONFLICT` para id já usado.

### A AAD não amarra ao site

O escopo `vault` da AAD tem seis segmentos e o `siteId` não é um deles ([ADR 0023](decisions/0023-identity-aad-and-key-envelope.md)): a credencial é amarrada ao próprio id e ao cofre, não ao site que a contém.

A consequência é estreita e precisa estar escrita: repor o ciphertext de uma credencial em **outra** credencial falha, e movê-lo para **outro cofre** falha, mas mudar a coluna `site_id` de uma credencial dentro do mesmo cofre não é detectado pela decifragem. Quem pode fazer isso é quem já escreve no banco.

Fechar essa aresta significaria acrescentar um segmento à AAD, e o momento de decidir é **antes** da primeira migration de conteúdo — depois dela, é migração de dado cifrado (`SECURITY.md` secao 18). A decisão está registrada como pendência em `DECISIONS.md` secao 7 e trava o `BLG-0504`.

### Response `201`

```json
{
  "data": {
    "id": "uuid",
    "siteId": "uuid",
    "vaultId": "uuid",
    "keyVersion": 1,
    "version": 1,
    "createdAt": "2026-07-30T22:00:00.000Z"
  }
}
```

### Erros

```text
VALIDATION_ERROR
IDENTIFIER_CONFLICT
VAULT_LOCKED_FOR_REKEY
CREDENTIAL_LIMIT_REACHED
KEY_VERSION_MISMATCH
IDEMPOTENCY_CONFLICT
```

---

## 58. GET `/vaults/:vaultId/sites/:siteId/credentials/:credentialId`

### Objetivo

Retornar credencial criptografada.

### Permissão

Membro ativo do cofre. O trio `vaultId`/`siteId`/`credentialId` é validado em conjunto: uma credencial que exista mas pertença a outro site responde `404`.

### Response

```json
{
  "data": {
    "id": "uuid",
    "vaultId": "uuid",
    "siteId": "uuid",
    "encryptedPayload": {
      "cryptoVersion": 1,
      "schemaVersion": 1,
      "algorithm": "XCHACHA20-POLY1305",
      "nonce": "base64url",
      "ciphertext": "base64url"
    },
    "keyVersion": 1,
    "version": 1,
    "createdBy": {
      "id": "uuid",
      "name": "Nome de Perfil"
    },
    "updatedBy": {
      "id": "uuid",
      "name": "Nome de Perfil"
    },
    "createdAt": "2026-07-30T22:00:00.000Z",
    "updatedAt": "2026-07-30T22:00:00.000Z"
  }
}
```

O W17 (`TELAS.md` secao 22) exibe "responsável pela última alteração, quando disponível", e é este `updatedBy` que o alimenta.

---

## 59. PATCH `/vaults/:vaultId/sites/:siteId/credentials/:credentialId`

### Objetivo

Atualizar credencial.

### Permissão

OWNER ou EDITOR.

### Request

```json
{
  "expectedVersion": 1,
  "encryptedPayload": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  },
  "keyVersion": 1
}
```

O `encryptedPayload` é sempre **inteiro**: usuário, senha e observação viajam no mesmo blob, então não existe atualizar só a senha. O cliente decifra, altera o campo e recifra o payload completo.

### Response

```json
{
  "data": {
    "id": "uuid",
    "version": 2,
    "updatedAt": "2026-07-30T22:10:00.000Z"
  }
}
```

### Erros

```text
VALIDATION_ERROR
VERSION_CONFLICT
KEY_VERSION_MISMATCH
VAULT_LOCKED_FOR_REKEY
```

---

## 60. DELETE `/vaults/:vaultId/sites/:siteId/credentials/:credentialId`

### Objetivo

Excluir credencial.

### Permissão

OWNER ou EDITOR.

### Request

```json
{
  "expectedVersion": 2,
  "confirmation": true
}
```

### Response

```http
204 No Content
```

### Erros

```text
VERSION_CONFLICT
VAULT_LOCKED_FOR_REKEY
VAULT_ACCESS_DENIED
```

---

# PARTE X — IMPORTAÇÃO

---

## 61. POST `/imports`

### Objetivo

Criar job de importação.

### Autenticação

Sim.

### Headers

```http
Idempotency-Key: <uuid>
```

### Importante

O CSV não é enviado.

### Request

```json
{
  "fileName": "credenciais.csv",
  "fileSize": 2048,
  "summary": {
    "totalRows": 20,
    "validRows": 18,
    "ignoredRows": 2,
    "failedRows": 0
  },
  "vaults": [
    {
      "vaultId": "uuid",
      "siteCount": 5,
      "credentialCount": 18
    }
  ]
}
```

### Response `201`

```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "createdAt": "2026-07-30T22:00:00.000Z"
  }
}
```

---

## 62. POST `/imports/:importId/vaults/:vaultId/commit`

### Objetivo

Gravar lote criptografado de um cofre.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "sites": [
    {
      "id": "uuid",
      "encryptedPayload": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "keyVersion": 1
    }
  ],
  "credentials": [
    {
      "id": "uuid",
      "siteId": "uuid",
      "encryptedPayload": {
        "cryptoVersion": 1,
        "schemaVersion": 1,
        "algorithm": "XCHACHA20-POLY1305",
        "nonce": "base64url",
        "ciphertext": "base64url"
      },
      "keyVersion": 1
    }
  ]
}
```

### Response

```json
{
  "data": {
    "importId": "uuid",
    "vaultId": "uuid",
    "status": "COMPLETED",
    "sitesCreated": 5,
    "credentialsCreated": 18
  }
}
```

### Regras

- validar membership;
- OWNER ou EDITOR;
- validar limites;
- transação por cofre;
- não aceitar sobrescrita automática;
- IDs devem ser únicos;
- `siteId` deve pertencer ao mesmo lote ou já existir no cofre;
- idempotência obrigatória.

---

## 63. POST `/imports/:importId/complete`

### Objetivo

Finalizar job.

### Request

```json
{
  "status": "COMPLETED"
}
```

### Response

```json
{
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "totalRows": 20,
    "validRows": 18,
    "ignoredRows": 2,
    "failedRows": 0,
    "vaultsCreated": 1,
    "sitesCreated": 5,
    "sitesReused": 2,
    "completedAt": "2026-07-30T22:10:00.000Z"
  }
}
```

---

## 64. GET `/imports/:importId`

### Objetivo

Consultar resultado.

### Response

```json
{
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "fileName": "credenciais.csv",
    "totalRows": 20,
    "validRows": 18,
    "ignoredRows": 2,
    "failedRows": 0,
    "vaultsCreated": 1,
    "sitesCreated": 5,
    "sitesReused": 2,
    "createdAt": "2026-07-30T22:00:00.000Z",
    "completedAt": "2026-07-30T22:10:00.000Z"
  }
}
```

---

## 65. POST `/imports/:importId/cancel`

### Objetivo

Cancelar job ainda não finalizado.

### Response

```http
204 No Content
```

---

# PARTE XI — REKEY

---

## 66. POST `/vaults/:vaultId/rekey/start`

### Objetivo

Iniciar rotação de chave.

### Permissão

OWNER.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "removedUserId": "uuid",
  "expectedVaultVersion": 4,
  "fromKeyVersion": 1,
  "toKeyVersion": 2
}
```

### Response `202`

```json
{
  "data": {
    "rekeyId": "uuid",
    "vaultId": "uuid",
    "status": "PROCESSING",
    "fromKeyVersion": 1,
    "toKeyVersion": 2,
    "siteCount": 10,
    "credentialCount": 25
  }
}
```

### Efeito

- bloquear mutações;
- impedir acesso do membro removido;
- retornar snapshot ao OWNER em chamada separada.

---

## 67. GET `/vaults/:vaultId/rekey/:rekeyId/snapshot`

### Objetivo

Retornar dados necessários ao rekey.

### Permissão

OWNER que iniciou ou OWNER atual.

### Response

```json
{
  "data": {
    "vault": {},
    "sites": [],
    "credentials": [],
    "remainingMembers": [
      {
        "userId": "uuid",
        "publicKey": "base64url"
      }
    ],
    "fromKeyVersion": 1,
    "toKeyVersion": 2
  }
}
```

---

## 68. POST `/vaults/:vaultId/rekey/:rekeyId/commit`

### Objetivo

Confirmar recriptografia completa.

### Headers

```http
Idempotency-Key: <uuid>
```

### Request

```json
{
  "expectedVaultVersion": 4,
  "encryptedVaultMetadata": {
    "cryptoVersion": 1,
    "schemaVersion": 1,
    "algorithm": "XCHACHA20-POLY1305",
    "nonce": "base64url",
    "ciphertext": "base64url"
  },
  "sites": [],
  "credentials": [],
  "memberEnvelopes": [
    {
      "userId": "uuid",
      "keyVersion": 2,
      "cryptoVersion": 1,
      "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
      "ephemeralPublicKey": "base64url",
      "encryptedVaultKey": "base64url"
    }
  ]
}
```

### Response

```json
{
  "data": {
    "rekeyId": "uuid",
    "status": "COMPLETED",
    "vaultVersion": 5,
    "keyVersion": 2,
    "completedAt": "2026-07-30T22:30:00.000Z"
  }
}
```

### Regras

- contagens exatas;
- IDs exatos;
- membros restantes com envelope;
- transação;
- remover envelopes antigos;
- concluir remoção;
- liberar cofre.

---

## 69. POST `/vaults/:vaultId/rekey/:rekeyId/cancel`

### Objetivo

Cancelar rekey não confirmado.

### Response

```http
204 No Content
```

### Regras

- restaurar estado mutável;
- manter membro removido bloqueado conforme política;
- registrar auditoria.

---

# PARTE XII — AUDITORIA

---

## 70. GET `/audit`

### Status

Opcional na interface da V1.

O registro interno é obrigatório desde a V1.

### Objetivo

Permitir consulta de eventos autorizados.

### Query

```text
vaultId
action
result
from
to
cursor
limit
```

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "action": "CREDENTIAL_UPDATED",
      "result": "SUCCESS",
      "actor": {
        "id": "uuid",
        "name": "Usuário"
      },
      "vaultId": "uuid",
      "entityType": "CREDENTIAL",
      "entityId": "uuid",
      "createdAt": "2026-07-30T22:00:00.000Z"
    }
  ],
  "meta": {
    "cursor": null,
    "hasMore": false
  }
}
```

### Segurança

Nunca retornar metadata sensível.

---

# PARTE XIII — RATE LIMIT

---

## 71. Limites por grupo

Valores finais serão configuráveis.

### Auth parameters

```text
20 requisições / 5 minutos / IP
```

### Login

```text
10 tentativas / 15 minutos / IP
5 tentativas consecutivas / conta
```

### Refresh

```text
30 requisições / 5 minutos / sessão
```

### Convites

```text
20 por hora / usuário
```

### Importação

```text
5 jobs simultâneos / usuário
```

### API autenticada geral

Limite amplo por usuário e IP.

---

## 72. Response `429`

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas tentativas. Aguarde antes de tentar novamente.",
    "requestId": "uuid",
    "details": [
      {
        "retryAfterSeconds": 60
      }
    ]
  }
}
```

Header:

```http
Retry-After: 60
```

---

# PARTE XIV — VALIDAÇÃO

---

## 73. Validação estrutural

A API valida:

- tipos;
- obrigatoriedade;
- formato UUID;
- base64url;
- enum;
- limites;
- versões;
- relação;
- tamanho.

A API não valida conteúdo cifrado.

---

## 74. Limites

Os limites existem em duas camadas, e a distinção importa porque elas falham em momentos diferentes.

### Limites de conteúdo, em caracteres do texto claro

Fixados em `@crypta/validation` e aplicados **no cliente**, antes de cifrar. A API não os vê: quando o payload chega, o conteúdo já é ciphertext opaco.

| Campo                    | Máximo | Origem                              |
| ------------------------ | ------ | ----------------------------------- |
| Nome do cofre            | 200    | `VAULT_LIMITS.name`                 |
| Descrição do cofre       | 2000   | `VAULT_LIMITS.description`          |
| Nome do site             | 200    | `SITE_LIMITS.name` — R0.4           |
| Link do site             | 2048   | `SITE_LIMITS.link` — R0.4           |
| Usuário da credencial    | 320    | `CREDENTIAL_LIMITS.username` — R0.4 |
| Senha da credencial      | 1024   | `CREDENTIAL_LIMITS.password` — R0.4 |
| Observação da credencial | 2000   | `CREDENTIAL_LIMITS.notes` — R0.4    |

O link usa 2048 porque é o teto prático de URL nos navegadores. O usuário usa 320 porque é o comprimento máximo de um endereço de e-mail, que é a forma mais comum de nome de usuário — e é maior que o `FIELD_LIMITS.email` de 254, que vale para o e-mail **da conta** e é validado como endereço de verdade.

### Tetos de ciphertext, em bytes decodificados

Aplicados **na API**, por schema, e é o que a validação estrutural consegue medir. Cada teto é calculado a partir do pior caso do formato correspondente — todos os caracteres com quatro bytes em UTF-8, mais o enquadramento JSON e a tag Poly1305 — e arredondado para o dobro, como já fazia `VAULT_LIMITS.encryptedPayloadBytes`.

```text
VAULT_ENCRYPTED_PAYLOAD_BYTES=18000
SITE_ENCRYPTED_PAYLOAD_BYTES=20000
CREDENTIAL_ENCRYPTED_PAYLOAD_BYTES=28000
```

Um teto por entidade, e não o genérico de 64 KiB: o limite genérico existe para o maior payload do sistema, e usá-lo em toda rota aceitaria uma credencial com dez vezes o conteúdo que o formato permite. Payload acima do teto é `400 VALIDATION_ERROR`, não `413` — quem estoura o campo estoura a validação de forma, e o `413` fica para o corpo inteiro da requisição.

### Limites de quantidade, por ambiente

**Configuráveis por variável de ambiente**, com o valor abaixo como padrão. Deixam de ser sugestão: cada um sustenta um código de erro que a API já devolve, e um limite sem configuração é um número escondido no código.

| Variável                   | Padrão   | Erro ao estourar           |
| -------------------------- | -------- | -------------------------- |
| `MAX_REQUEST_BYTES`        | 1048576  | `PAYLOAD_TOO_LARGE`        |
| `MAX_VAULTS_PER_USER`      | 100      | `VAULT_LIMIT_REACHED`      |
| `MAX_SITES_PER_VAULT`      | 10000    | `SITE_LIMIT_REACHED`       |
| `MAX_CREDENTIALS_PER_SITE` | 1000     | `CREDENTIAL_LIMIT_REACHED` |
| `MAX_MEMBERS_PER_VAULT`    | 20       | R0.5                       |
| `MAX_PENDING_INVITATIONS`  | 50       | R0.5                       |
| `MAX_ACTIVE_SESSIONS`      | 20       | R0.6                       |
| `MAX_IMPORT_ROWS`          | 10000    | R0.6                       |
| `MAX_IMPORT_BYTES`         | 10485760 | R0.6                       |

As três primeiras linhas de conteúdo — cofres, sites e credenciais — são lidas da configuração a partir da R0.4. As demais entram com a fase que as usa, e até lá o padrão é o valor documentado aqui.

Os tetos de ciphertext e os limites de conteúdo **não** são configuráveis por ambiente: mudá-los muda o que cabe em um payload já gravado, e isso é versão de formato, não configuração.

---

## 75. CORS

Permitir apenas origens configuradas.

Exemplo:

```text
https://crypta-test.example.com
https://crypta.example.com
```

Não usar:

```text
Access-Control-Allow-Origin: *
```

em rotas autenticadas.

---

## 76. CSRF

Como o refresh Web utiliza cookie:

- validar Origin;
- validar Referer quando aplicável;
- usar SameSite;
- considerar CSRF token em rotas sensíveis baseadas em cookie;
- access token continua em Authorization.

---

# PARTE XVI — SWAGGER

---

## 77. Endpoint

Sugestão:

```text
/api/docs
```

Em produção poderá ser:

- protegido;
- desativado;
- limitado por rede;
- publicado sem exemplos sensíveis.

---

## 78. Requisitos de documentação

Cada endpoint deverá documentar:

- resumo;
- descrição;
- autenticação;
- permissão;
- parâmetros;
- request;
- response;
- erros;
- idempotência;
- rate limit;
- exemplos fictícios;
- versão.

---

# PARTE XVII — VERSIONAMENTO E COMPATIBILIDADE

---

## 79. Versão da API

Prefixo:

```text
/api/v1
```

Mudanças incompatíveis exigem:

```text
/api/v2
```

Mudanças compatíveis podem ocorrer na mesma versão:

- novo campo opcional;
- novo endpoint;
- novo código de erro;
- novo enum quando clientes tolerarem;
- novo header informativo.

A versão do contrato não é a mesma coisa que a versão da aplicação.

```text
API contract: /api/v1
Application release: 0.4.0-rc.2
```

---

## 80. Versão da aplicação e releases

A aplicação seguirá Semantic Versioning.

Origem:

```text
VERSION
```

Formatos:

```text
Development: 0.4.0-dev
Staging:     0.4.0-rc.2
Production:  0.4.0
```

Tags:

```text
v0.4.0-rc.2
v0.4.0
```

Regras:

- uma tag publicada é imutável;
- uma versão publicada não pode ser reutilizada;
- staging é identificado por RC;
- production é identificada por release estável;
- `/version` deverá refletir o build;
- uma release normal não será reconstruída para produção;
- production receberá os mesmos digests registrados na RC aprovada.

O fluxo completo está em `GITHUB_RELEASE_FLOW.md`.

---

## 81. Versionamento criptográfico

Separado da API e da release:

```text
cryptoVersion
schemaVersion
keyVersion
entity version
```

Significados:

- `cryptoVersion`: algoritmo ou formato criptográfico;
- `schemaVersion`: conteúdo interno cifrado;
- `keyVersion`: versão da VaultKey;
- `version`: concorrência da entidade.

Uma release da aplicação não altera automaticamente essas versões.

Mudanças criptográficas exigem ADR, migration e testes cross-platform.

# PARTE XVIII — IDEMPOTÊNCIA

---

## 82. Operações idempotentes

Exigir em:

- setup;
- criação de cofre;
- criação de convite;
- aceite de convite;
- criação de site;
- criação de credencial;
- criação de import;
- commit de import;
- start de rekey;
- commit de rekey.

---

## 83. Comportamento

Mesma chave e mesmo payload:

- retornar resposta anterior.

Mesma chave e payload diferente:

```http
409 Conflict
```

Código:

```text
IDEMPOTENCY_CONFLICT
```

---

# PARTE XIX — SEGURANÇA DE LOGS

---

## 84. Campos proibidos

Não registrar:

```text
authSecret
refreshToken
accessToken
encryptedPrivateKey
privateKey
VaultKey
inviteSecret
token de convite completo
ciphertext completo
senha
usuário da credencial
observação
cookie
Authorization
CSV
```

---

## 85. Sanitização

Middleware/interceptor deverá:

- remover headers sensíveis;
- mascarar e-mail quando apropriado;
- limitar tamanho;
- evitar body completo;
- registrar request ID.

---

# PARTE XX — CLIENTES

---

## 86. Web

Fluxo:

```text
React
→ Axios
→ Access token em memória
→ Refresh por cookie
→ API
```

---

## 87. Android

Fluxo:

```text
React Native
→ Axios/fetch
→ Access token em memória
→ Refresh token no Keystore
→ API
```

---

## 88. Extensão futura

Usará a mesma API, mas deverá possuir:

- client type próprio;
- política de sessão específica;
- limites específicos;
- revisão de segurança.

---

# PARTE XXI — TESTES DA API

---

## 89. Testes unitários

Obrigatórios para:

- services;
- policies;
- guards;
- validators;
- mappers;
- idempotência;
- versionamento;
- rate limit;
- sanitização.

---

## 90. Testes de integração

Obrigatórios para:

- setup;
- login;
- refresh;
- reuse detection;
- sessões;
- criação de cofre;
- autorização;
- CRUD de site;
- CRUD de credencial;
- convite;
- aceite;
- importação;
- rekey;
- concorrência;
- exclusão.

---

## 91. Casos de segurança

Testar:

- IDOR;
- token expirado;
- sessão revogada;
- membership removido;
- editor excluindo cofre;
- envelope de outro usuário;
- site de outro cofre;
- credential com site cruzado;
- token de convite inválido;
- convite expirado;
- payload excessivo;
- ciphertext malformado;
- SQL injection;
- CORS;
- CSRF;
- rate limit.

---

# PARTE XXII — ORDEM DE IMPLEMENTAÇÃO

---

## 92. Primeira API e deploy development

Para validar GitHub Actions, GHCR e Coolify:

```text
GET /health/live
GET /health/ready
GET /version
```

Fluxo:

```text
develop
→ build Web/API
→ GHCR
→ Coolify development
→ mysql-development
```

Critérios:

- `/version` retorna o commit implantado;
- Web consulta health e version;
- banco não está público.

Depois:

```text
GET /setup/status
POST /setup
GET /auth/parameters
POST /auth/login
```

---

## 93. Segunda fase

```text
GET /users/me
GET /users/me/key-bundle
POST /auth/refresh
POST /auth/logout
GET /sessions
```

---

## 94. Terceira fase

```text
POST /vaults
GET /vaults
GET /vaults/:id
GET /vaults/:id/snapshot
PATCH /vaults/:id
DELETE /vaults/:id
```

---

## 95. Quarta fase

```text
/sites
/credentials
```

---

## 96. Quinta fase

```text
/invitations
/members
/rekey
```

---

## 97. Sexta fase

```text
/imports
/audit
/changes
```

### Validação de release

Antes da R1.0:

1. criar `release/x.y.z`;
2. promover para `staging`;
3. publicar RC;
4. validar `/version`;
5. validar migrations;
6. validar o manifesto de digests;
7. promover `staging → main`;
8. validar a mesma versão e commit em production;
9. confirmar que não houve novo build;
10. sincronizar `main → develop`.

# PARTE XXIII — CRITÉRIOS DE ACEITE

---

## 98. Critérios gerais

A API será considerada pronta para a V1 quando:

- estiver versionada;
- possuir Swagger;
- expuser health, readiness e version;
- `/version` identificar versão, commit, ambiente e horário do build;
- tiver autenticação funcional;
- refresh token for rotacionado;
- sessões forem revogáveis;
- autorização ocorrer no backend;
- IDOR estiver coberto por testes;
- cofres privados e compartilhados funcionarem;
- sites e credenciais forem armazenados cifrados;
- importação não enviar CSV em texto aberto;
- convite não enviar inviteSecret à API;
- rekey funcionar;
- concorrência usar `version`;
- idempotência funcionar;
- erros forem padronizados;
- rate limit estiver ativo;
- logs não possuírem dados sensíveis;
- testes passarem;
- development, staging e production estiverem isolados;
- staging corresponder à RC publicada;
- production utilizar os mesmos digests homologados;
- rollback estiver validado;
- documentação estiver atualizada.

---

## 99. Resumo dos endpoints da V1

### Públicos

```text
GET    /health/live
GET    /health/ready
GET    /version
GET    /setup/status
POST   /setup
GET    /auth/parameters
POST   /auth/login
POST   /auth/refresh
GET    /invitations/by-token/:token
```

### Autenticação

```text
POST   /auth/logout
POST   /auth/logout-all
```

### Usuário

```text
GET    /users/me
PATCH  /users/me
GET    /users/me/key-bundle
POST   /users/me/change-password
```

### Sessões

```text
GET    /sessions
DELETE /sessions/:sessionId
DELETE /sessions
```

### Cofres

```text
GET    /vaults
POST   /vaults
GET    /vaults/:vaultId
PATCH  /vaults/:vaultId
DELETE /vaults/:vaultId
GET    /vaults/:vaultId/snapshot
```

### Membros

```text
GET    /vaults/:vaultId/members
DELETE /vaults/:vaultId/members/:memberId
POST   /vaults/:vaultId/leave
```

### Convites

```text
GET    /invitations
POST   /vaults/:vaultId/invitations
GET    /vaults/:vaultId/invitations
POST   /invitations/:invitationId/accept
POST   /invitations/:invitationId/decline
DELETE /vaults/:vaultId/invitations/:invitationId
```

### Sites

```text
GET    /vaults/:vaultId/sites
POST   /vaults/:vaultId/sites
GET    /vaults/:vaultId/sites/:siteId
PATCH  /vaults/:vaultId/sites/:siteId
DELETE /vaults/:vaultId/sites/:siteId
```

### Credenciais

```text
GET    /vaults/:vaultId/sites/:siteId/credentials
POST   /vaults/:vaultId/sites/:siteId/credentials
GET    /vaults/:vaultId/sites/:siteId/credentials/:credentialId
PATCH  /vaults/:vaultId/sites/:siteId/credentials/:credentialId
DELETE /vaults/:vaultId/sites/:siteId/credentials/:credentialId
```

### Importação

```text
POST   /imports
POST   /imports/:importId/vaults/:vaultId/commit
POST   /imports/:importId/complete
GET    /imports/:importId
POST   /imports/:importId/cancel
```

### Rekey

```text
POST   /vaults/:vaultId/rekey/start
GET    /vaults/:vaultId/rekey/:rekeyId/snapshot
POST   /vaults/:vaultId/rekey/:rekeyId/commit
POST   /vaults/:vaultId/rekey/:rekeyId/cancel
```

### Opcionais ou posteriores

```text
GET    /vaults/:vaultId/changes
GET    /audit
PATCH  /vaults/:vaultId/members/:memberId
```

---

## 100. Observações finais

Este documento define o contrato inicial.

Durante a implementação:

- DTOs deverão refletir os exemplos;
- Swagger deverá permanecer sincronizado;
- breaking changes deverão ser evitadas;
- exemplos deverão usar dados fictícios;
- nenhum exemplo deverá conter segredo real;
- qualquer mudança deverá atualizar contracts, testes e documentação;
- mudanças em `/version` deverão preservar compatibilidade operacional;
- metadados de build deverão ser injetados pelo pipeline;
- URLs e ambientes deverão seguir `config_user.md`;
- o fluxo de release deverá seguir `GITHUB_RELEASE_FLOW.md`.
