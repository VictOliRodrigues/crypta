# ADR 0003 — Criptografia no cliente

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O produto armazena senhas reais de serviços de terceiros. A pergunta que define a arquitetura é: o que um atacante consegue com uma cópia do banco de dados?

Se o backend detém a chave, a resposta é "tudo". Um dump vazado, um backup mal protegido, uma credencial de banco exposta ou o comprometimento do processo da aplicação entregam todas as senhas de todos os usuários. O mesmo vale para quem administra a VPS.

O sistema é self-hosted e o repositório é público. Ambos ampliam a superfície: o código é auditável por qualquer pessoa, e a infraestrutura é operada por quem também é usuário do cofre.

## Decisão

Todo conteúdo sensível é criptografado no cliente antes de chegar à API. O backend armazena e coordena blobs opacos.

Criptografado no cliente:

- nome e descrição do cofre;
- nome e link do site;
- usuário, senha e observação da credencial.

Nunca enviado ao backend em texto aberto:

- senha original da conta;
- `RootKey`, `UserEncryptionKey`;
- chave privada descriptografada;
- `VaultKey`;
- arquivo CSV.

O backend continua responsável por autenticação, sessões, autorização, memberships, convites, persistência, auditoria e consistência transacional — tudo que pode ser decidido sem ler o conteúdo.

Algoritmos: Argon2id para derivação, HKDF-SHA-256 para separação de contexto, XChaCha20-Poly1305 para criptografia autenticada e X25519 para compartilhamento. Nenhum algoritmo próprio.

Todo payload carrega `cryptoVersion`, `schemaVersion`, algoritmo, nonce e ciphertext, e é autenticado com uma AAD que amarra o ciphertext à sua entidade e ao seu cofre.

## Alternativas consideradas

**Criptografia no backend com chave mestra da aplicação.** Rejeitada. Simplifica busca e recuperação, mas concentra todo o risco em um segredo: quem obtiver a chave mestra e o banco obtém todas as senhas. Não atende ao objetivo do produto.

**Colunas em texto aberto com o banco protegido por rede.** Rejeitada. Faz o modelo de segurança depender inteiramente do perímetro; um backup vazado basta.

**Criptografia de disco / TDE.** Rejeitada como solução isolada. Protege contra roubo físico do disco, não contra o processo da aplicação comprometido nem contra um dump lógico.

## Consequências positivas

- Um vazamento do banco expõe metadados, não senhas.
- O operador da VPS não consegue ler os cofres em operação normal.
- O produto se comporta como um gerenciador de senhas de verdade, não como um CRUD com senhas.

## Consequências negativas

- **Busca server-side é impossível** para o conteúdo. A busca acontece no cliente, depois de descriptografar (DEC-016).
- **Compartilhamento fica mais complexo:** exige envelopes por membro e rekey na remoção (ADR 0005).
- **Recuperação de senha não preserva os dados.** Sem a senha correta, ninguém — nem o servidor — abre a chave privada.
- **O cliente Web passa a ser parte crítica da segurança.** Um servidor comprometido pode entregar JavaScript malicioso.
- Compatibilidade criptográfica entre Web e Android vira requisito de teste, não detalhe.

## Riscos

- **Frontend Web comprometido.** É a limitação estrutural do modelo. Mitigações: CSP restritiva, ausência de scripts de terceiros, revisão de dependências, e o aplicativo Android assinado como caminho alternativo.
- **Dispositivo comprometido.** Malware, keylogger ou captura de tela expõem o conteúdo em uso. Fora do alcance de qualquer arquitetura.
- **Erro de implementação criptográfica.** Mitigado por vetores determinísticos, testes de adulteração e de AAD incorreta, e pela proibição de fallback inseguro.
- **Perda de acesso por senha esquecida.** Consequência aceita e comunicada ao usuário.

## Impactos

- **Código:** `packages/crypto-core` e adapters por plataforma.
- **Banco:** nenhuma coluna em texto aberto para conteúdo sensível.
- **API:** contratos recebem `encryptedPayload`, nunca campos legíveis.
- **Segurança:** define todo o `SECURITY.md`.
- **Documentação:** `ARCHITECTURE.md` secoes 13 e 14.

## Plano de migração

Não se aplica. Mudanças futuras de algoritmo exigem nova `cryptoVersion`, leitor da versão anterior e recriptografia controlada.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 13, 14, 47 e 48
- `docs/DECISIONS.md` DEC-003, DEC-R001, DEC-R002
- `SECURITY.md`
- `CLAUDE.md` secoes 7, 8 e 9
