# ADR 0007 — API REST versionada

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

Três clientes vão consumir a mesma API: Web, Android e, no futuro, extensão de navegador. Eles evoluem em ritmos diferentes — o aplicativo Android é distribuído por APK, então versões antigas continuam em uso por tempo indeterminado depois de um deploy do servidor.

Como o backend armazena blobs opacos, os payloads são simples: identificadores, versões, relações e campos criptografados. Não há consulta rica sobre o conteúdo, porque o servidor não consegue ler o conteúdo.

## Decisão

REST sobre JSON, com prefixo de versão em todas as rotas:

```text
/api/v1
```

Envelope de sucesso:

```json
{ "data": {}, "meta": {} }
```

Envelope de erro:

```json
{
  "error": {
    "code": "VAULT_ACCESS_DENIED",
    "message": "Você não possui permissão para esta ação.",
    "requestId": "uuid",
    "details": []
  }
}
```

Os códigos de erro são estáveis e vivem em `@vault/contracts`: um cliente pode ramificar comportamento a partir deles, então renomear ou remover um código é mudança incompatível.

Regras fixas:

- toda resposta carrega `X-Request-Id`;
- nenhuma resposta contém stack trace, query, segredo ou path interno;
- paginação por cursor, com cursor opaco;
- concorrência otimista por `expectedVersion`, com `409 VERSION_CONFLICT`;
- idempotência via `Idempotency-Key` nas operações críticas;
- OpenAPI gerado pelo Swagger.

O Swagger fica desabilitado em produção: mesmo sem segredos, ele descreve toda a superfície da API.

## Alternativas consideradas

**GraphQL.** Rejeitada para a V1. O principal ganho — o cliente escolher campos — não se aplica quando o campo relevante é um blob opaco. Em troca, traria complexidade de autorização por resolver, controle de profundidade de query e cache mais difícil, tudo em superfície de segurança.

**RPC proprietário.** Rejeitada. Perde ferramental, documentação automática e familiaridade sem ganho correspondente.

**WebSocket como canal principal.** Rejeitada. O sistema é online-first com polling leve; sincronização em tempo real não é requisito da V1. WebSocket permanece opção futura para notificação de mudança.

**Versionamento por header em vez de path.** Rejeitada por praticidade: o prefixo no path é visível em log, em curl e em configuração de proxy, o que ajuda no diagnóstico.

## Consequências positivas

- Os três clientes usam o mesmo contrato, tipado em `@vault/contracts`.
- Uma versão antiga do Android continua funcionando enquanto `/api/v1` existir.
- Códigos de erro estáveis permitem tratamento consistente na interface.
- OpenAPI documenta a API sem esforço manual.

## Consequências negativas

- Introduzir `/api/v2` exigirá manter as duas versões durante a transição.
- Envelope fixo adiciona um nível de aninhamento em toda resposta.
- Algumas telas farão mais de uma requisição onde uma query única resolveria.

## Riscos

- **Mudança incompatível introduzida sem perceber.** Mitigado pelos contratos compartilhados: alterar o contrato quebra o typecheck dos clientes no mesmo pull request.
- **Mensagem de erro vazando detalhe interno.** Mitigado pelo filtro global, que traduz qualquer exceção para mensagem pública genérica e registra a causa apenas no log, correlacionada por `requestId`.

## Impactos

- **Código:** `packages/contracts`, controllers e filtro de exceções.
- **Documentação:** `API.md` é a fonte de verdade dos contratos.
- **Mobile:** consome o mesmo `@vault/contracts`.

## Plano de migração

Não se aplica. Uma futura `/api/v2` conviverá com `/api/v1` por um período documentado.

## Referências internas

- `docs/API.md`
- `docs/ARCHITECTURE.md` secao 31
- `docs/DECISIONS.md` DEC-007
