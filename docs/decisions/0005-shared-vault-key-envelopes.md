# ADR 0005 — VaultKey por cofre e envelope por membro

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

Um cofre pode ser compartilhado com outro usuário. Como o conteúdo é criptografado no cliente (ADR 0003) e o servidor não tem chave nenhuma, compartilhar significa fazer a chave do cofre chegar ao outro usuário sem passar em texto aberto pelo servidor.

Há ainda o problema inverso: quando um membro é removido, ele já pode ter guardado uma cópia da chave do cofre. Revogar o acesso no banco impede novas consultas pela API, mas não desfaz o que ele já obteve.

## Decisão

Cada cofre tem uma `VaultKey` simétrica de 256 bits, gerada no cliente e nunca enviada em texto aberto. Ela criptografa os metadados do cofre, os sites e as credenciais daquele cofre.

Para cada membro ativo existe um `VaultKeyEnvelope`: a `VaultKey` protegida para a chave pública X25519 daquele membro. Só a chave privada correspondente recupera a `VaultKey`.

```text
VaultKey + PublicKey do membro → VaultKeyEnvelope
```

O convite usa um segredo temporário. O cliente do proprietário gera `inviteToken` e `inviteSecret`, protege a `VaultKey` com o `inviteSecret` e monta um link:

```text
https://app.exemplo.com/invite/{token}#secret={secret}
```

O fragmento após `#` não é enviado ao servidor pelo navegador. O servidor guarda o hash do token e a `VaultKey` protegida, mas não o segredo que a abre. Ao aceitar, o convidado usa o segredo do fragmento para recuperar a `VaultKey` e cria o próprio envelope.

**Remover um membro obriga a rotação da chave.** O proprietário gera nova `VaultKey`, recriptografa todo o conteúdo do cofre, cria envelopes apenas para os membros restantes e remove os antigos, tudo em uma transação. O `keyVersion` do cofre é incrementado.

## Alternativas consideradas

**Uma única chave por usuário, sem chave por cofre.** Rejeitada. Compartilhar um cofre exigiria compartilhar a chave que abre todos os outros.

**Enviar a `VaultKey` ao servidor para ele redistribuir.** Rejeitada. O servidor passaria a poder abrir todos os cofres compartilhados, anulando o ADR 0003.

**Convite por chave pública do convidado, sem segredo no fragmento.** Elegante, mas exige que o convidado já tenha conta e chave pública publicada. Como o escopo prevê convidar um e-mail ainda não cadastrado, o fluxo por segredo cobre os dois casos com um mecanismo só.

**Não rotacionar a chave ao remover membro.** Rejeitada. Deixaria o ex-membro capaz de ler qualquer conteúdo futuro do cofre a partir de uma cópia do banco.

## Consequências positivas

- Comprometer um cofre não compromete os outros.
- Remover um membro é criptograficamente efetivo para o conteúdo futuro.
- O servidor coordena o compartilhamento sem nunca ver a chave.
- Cada membro tem um envelope individual, então a revogação é granular.

## Consequências negativas

- Rekey é o fluxo mais complexo do sistema: precisa bloquear mutações, recriptografar todo o conteúdo no cliente e confirmar tudo em uma transação.
- Um cofre grande torna o rekey lento e pesado no cliente.
- Quem tiver o link completo e uma conta com o e-mail autorizado pode tentar aceitar o convite; o link precisa ser enviado por canal confiável.
- Todo membro precisa ter par de chaves antes de receber um envelope.

## Riscos

- **Falha no meio do rekey.** Mitigado por transação: ou tudo é confirmado, ou o cofre permanece com a chave anterior e o processo pode ser retomado.
- **`inviteSecret` vazando por log, histórico do navegador ou referrer.** Mitigado pelo uso de fragmento, pela remoção do segredo da URL após leitura, pela proibição de persistir e pelo `Referrer-Policy: no-referrer`.
- **Rekey em cofre grande estourando memória do cliente.** Pendência de estratégia registrada em `DECISIONS.md`.
- **Limitação inevitável:** nenhuma rotação apaga o que o ex-membro já copiou, memorizou ou capturou em tela. A rotação protege dados futuros e cópias futuras do banco — e isso precisa estar claro para o usuário.

## Impactos

- **Código:** `KeyExchangeAdapter`, fluxos de convite, aceite, remoção e rekey.
- **Banco:** tabelas de envelope, membership, convite e `keyVersion` no cofre.
- **API:** `/invitations`, `/memberships`, `/vaults/:id/rekey/start` e `/commit`.
- **Segurança:** define o modelo de compartilhamento.

## Plano de migração

Não se aplica.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 14.6, 14.7, 23 e 24
- `docs/DECISIONS.md` DEC-005, DEC-006, DEC-028
- `docs/ROADMAP.md` secoes 27 a 32
