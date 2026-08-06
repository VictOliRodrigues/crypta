# ADR 0004 — Separação entre autenticação e criptografia

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O usuário digita uma senha. Essa senha precisa cumprir dois papéis: provar ao servidor que a pessoa é quem diz ser, e proteger a chave privada que abre os cofres.

Se o mesmo valor derivado servir aos dois papéis, o servidor — que precisa receber algo para verificar o login — passa a possuir material capaz de abrir a chave privada. Isso anularia o ADR 0003 por um caminho lateral: não adianta criptografar no cliente se o segredo de autenticação enviado a cada login também descriptografa.

Enviar a senha original ao servidor tem o mesmo problema, agravado: o servidor veria a senha em memória a cada login, e um log acidental ou um dump de memória a exporia.

## Decisão

A senha do usuário nunca é enviada ao servidor. Dela derivam, no cliente, segredos com propósitos separados:

```text
UserPassword
    │
    ├── Argon2id + kdfSalt
    │       ↓
    │    RootKey
    │
    ├── HKDF(info="auth")
    │       ↓
    │    AuthSecret            → enviado ao servidor
    │
    └── HKDF(info="user-encryption")
            ↓
         UserEncryptionKey     → nunca sai do cliente
```

O servidor recebe apenas o `AuthSecret` e armazena um hash forte dele. O `UserEncryptionKey` protege a chave privada X25519 do usuário e jamais trafega.

Os rótulos HKDF `auth` e `user-encryption` são constantes de protocolo, definidas em `HKDF_INFO` no `crypto-core`. Alterá-los invalida todo material derivado existente.

O `AuthSecret` continua sendo uma credencial: trafega só por HTTPS, nunca é logado e nunca é persistido no cliente.

Os parâmetros do Argon2id são armazenados por usuário, para permitir recalibração futura sem invalidar contas existentes.

## Alternativas consideradas

**Enviar a senha original e deixar o servidor fazer o hash.** É o modelo tradicional. Rejeitada porque expõe a senha ao servidor a cada login — e, sendo a mesma senha que deriva a chave de criptografia, entregaria o cofre junto.

**Uma única chave derivada para os dois usos.** Rejeitada. O servidor precisa receber o verificador de autenticação; se ele for igual à chave de criptografia, o servidor pode abrir a chave privada.

**SRP ou OPAQUE (PAKE).** Não descartadas por mérito — dariam garantias melhores, incluindo resistência a servidor malicioso durante o login. Adiadas por complexidade de implementação e escassez de bibliotecas maduras e auditadas para Web e React Native. Podem ser reconsideradas em versão futura, com ADR próprio.

## Consequências positivas

- O servidor nunca vê material capaz de descriptografar cofres.
- O custo do Argon2id fica no cliente, permitindo parâmetros mais altos sem sobrecarregar a VPS.
- Alterar a senha não exige recriptografar cofre nenhum: basta gerar novo salt, derivar novas chaves e recriptografar apenas a chave privada.

## Consequências negativas

- O cliente precisa consultar os parâmetros KDF antes de derivar, o que adiciona uma requisição ao login.
- Esse endpoint precisa responder de forma estruturalmente válida mesmo para e-mails inexistentes, sob risco de virar oráculo de enumeração de contas.
- O login fica mais lento pelo custo do Argon2id — proporcionalmente mais no Android mais fraco suportado.
- Vetores criptográficos cross-platform passam a ser obrigatórios.

## Riscos

- **Parâmetros de Argon2id mal calibrados.** Baixos demais enfraquecem a proteção; altos demais tornam o login inviável no Android. Pendência `PEND-004`, a ser medida em navegador desktop, Android médio e Android mais fraco suportado.
- **Enumeração de contas pelo endpoint de parâmetros.** Mitigado pela resposta sintética para e-mails desconhecidos.
- **`AuthSecret` tratado como menos sensível por ser derivado.** Ele é credencial completa: quem o obtém, autentica. Proibido em log, em URL e em storage.

## Impactos

- **Código:** `KdfAdapter` em `crypto-core`, fluxo de login e de troca de senha.
- **API:** `GET /auth/parameters`, `POST /auth/login`, `GET /users/me/key-bundle`.
- **Banco:** hash do `AuthSecret`, parâmetros KDF e chave privada criptografada por usuário.
- **Segurança:** base do modelo de autenticação.

## Plano de migração

Não se aplica. Mudança futura de KDF exige nova versão de bundle, leitura da anterior e rederivação na próxima autenticação bem-sucedida.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 14.3 a 14.5, 16 e 25
- `docs/DECISIONS.md` DEC-004, PEND-001, PEND-002, PEND-004
- `SECURITY.md`
