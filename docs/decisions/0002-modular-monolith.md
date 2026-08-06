# ADR 0002 — Monólito modular no backend

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O backend precisa autenticar usuários, controlar sessões, decidir autorização por cofre, persistir blobs criptografados, gerenciar convites e registrar auditoria.

O sistema começa com dois usuários e roda em uma VPS única. As operações mais delicadas — criar cofre, aceitar convite, remover membro, rekey, importar em lote — precisam de transação: criar um cofre sem criar o membership OWNER, ou remover um membro sem invalidar seu envelope, deixa o sistema em um estado que o modelo de autorização não prevê.

## Decisão

A API é um monólito modular em NestJS, com um módulo por domínio e camadas fixas dentro de cada módulo:

```text
module/
├── controllers/   recebe request, valida DTO, chama service
├── services/      um caso de uso por arquivo
├── repositories/  único lugar com Prisma
├── policies/      autorização centralizada
├── dto/
├── mappers/       modelo interno nunca vaza para a resposta
└── errors/
```

Não serão introduzidos, sem nova decisão formal: microserviços, filas, mensageria, Redis, service mesh, múltiplos bancos, event sourcing, CQRS completo, GraphQL ou Kubernetes.

## Alternativas consideradas

**Microserviços por domínio.** Rejeitada. Uma transação que hoje é uma linha de Prisma viraria coordenação distribuída — com dois usuários e uma VPS, isso é complexidade sem contrapartida. O risco não é técnico apenas: consistência parcial em um cofre de senhas significa acesso concedido ou revogado pela metade.

**Serverless / functions.** Rejeitada. Cold start prejudica a experiência, o modelo de sessão exige estado revogável em banco e o custo operacional de manter três ambientes isolados aumenta.

**Monólito sem separação interna.** Rejeitada. É o caminho conhecido para autorização espalhada por controllers, que é exatamente a classe de bug que este produto não pode ter.

## Consequências positivas

- Transações locais e simples nas operações críticas.
- Um único artefato para construir, implantar, versionar e reverter — o que sustenta a promoção por digest do ADR 0012.
- Observabilidade direta: um `requestId` cobre a requisição inteira.
- Autorização concentrada em `policies/`, auditável em um lugar só.

## Consequências negativas

- Escala vertical apenas. Aceitável para a carga prevista.
- Um defeito grave derruba a API inteira. Mitigado por health checks e rollback por digest.
- A disciplina modular depende de revisão: nada no runtime impede um service de chamar o repositório de outro módulo.

## Riscos

- **Erosão dos limites entre módulos com o tempo.** Mitigado pelo checklist de revisão e pela regra de lint que impede instanciar `PrismaClient` fora de `database/prisma`.
- **Necessidade futura de processamento assíncrono** (envio de e-mail de convite, por exemplo). Quando aparecer, será uma decisão nova e registrada, não uma introdução silenciosa de fila.

## Impactos

- **Código:** estrutura de `apps/api/src/modules`.
- **Segurança:** autorização obrigatoriamente em `policies/`.
- **Deploy:** um serviço de API por ambiente no Coolify.
- **Documentação:** `ARCHITECTURE.md` secoes 4.1 e 10.

## Plano de migração

Não se aplica.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 4.1 e 10
- `docs/DECISIONS.md` DEC-002, DEC-012, DEC-R007
- `docs/STYLE_GUIDE.md` secoes 22 a 29
