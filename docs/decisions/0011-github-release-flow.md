# ADR 0011 — Fluxo de branches, versões e releases

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O produto guarda credenciais reais. Uma versão defeituosa em produção não é um incômodo: pode significar perda de acesso a dados que só existem ali, ou exposição.

Ao mesmo tempo, o desenvolvimento não pode parar durante a homologação. Se `develop` congelar enquanto uma versão é testada, ou o teste vira pressa ou o trabalho para.

O repositório é público e as tags publicadas viram referência para rollback — elas precisam ser confiáveis.

## Decisão

Três branches permanentes com responsabilidades distintas:

```text
develop   integração contínua, branch padrão
staging   conteúdo em homologação
main      produção
```

Fluxos permitidos, e apenas estes:

```text
feature/*  → develop
bugfix/*   → develop
chore/*    → develop
refactor/* → develop
docs/*     → develop
security/* → develop

fix/*      → release/*
release/*  → staging
staging    → main
main       → develop

hotfix/*   → main
main       → release/*   somente com release ativa
```

O workflow `validate-pr-flow.yml` bloqueia qualquer outra combinação, e o check é obrigatório nos rulesets.

**Versionamento:** Semantic Versioning, com o arquivo `VERSION` na raiz contendo apenas `MAJOR.MINOR.PATCH`, sem prefixo `v`. O arquivo só muda ao iniciar uma release ou um hotfix.

**Ciclo:**

```text
develop → release/x.y.z → staging → vX.Y.Z-rc.N → Pre-release
                                  ↓ aprovação
                          main → vX.Y.Z → Release → production → main → develop
```

**Correção durante a homologação** entra por `fix/* → release/*`, nunca direto em `staging`. Cada promoção gera uma nova RC.

**A branch `release/*` sobrevive** a toda a homologação e só é excluída depois da publicação em produção e da sincronização `main → develop`. Por isso ela não aparece na lista do workflow de limpeza automática.

**Hotfix** nasce de `main`, incrementa PATCH e retorna a `develop` e à release ativa, se houver. Ao chegar na release ativa, o código do hotfix entra, mas o `VERSION` mantém a versão futura daquela release.

**Tags publicadas são imutáveis.** Nunca movidas, nunca apagadas para reutilização. Uma correção gera uma nova RC ou uma nova versão PATCH.

Estratégias de merge: squash em branches temporárias; merge commit nas promoções entre branches permanentes, para preservar ancestralidade.

## Alternativas consideradas

**Trunk-based com feature flags.** Rejeitada para esta fase. Funciona bem com automação de teste madura e deploy contínuo em produção; aqui a homologação manual é justamente o gate que protege dados reais.

**GitHub Flow (só `main` e feature branches).** Rejeitada. Não oferece lugar para congelar uma versão em homologação enquanto o desenvolvimento segue.

**Git Flow completo com `develop` e `release` mais branches de suporte.** O fluxo adotado é uma versão enxuta dele. A adição de `staging` como branch permanente reflete o que o Coolify realmente implanta.

**Corrigir direto em `staging`.** Rejeitada explicitamente. A correção ficaria fora da branch de release e a RC deixaria de ser reproduzível a partir dela.

**Excluir `release/*` após a primeira RC.** Rejeitada. É exatamente o lugar onde as correções de homologação precisam entrar.

## Consequências positivas

- `develop` nunca congela.
- Toda promoção é rastreável e a ancestralidade entre branches é preservada.
- Uma tag identifica sem ambiguidade o que está em produção.
- Combinações inválidas de branch são bloqueadas por automação, não por lembrança.

## Consequências negativas

- Mais branches e mais pull requests do que um fluxo simples.
- Exige rulesets configurados manualmente no GitHub e mantidos.
- A sincronização `main → develop` é um passo fácil de esquecer, e esquecê-lo faz um hotfix se perder.
- Uma release ativa precisa ser claramente identificada, ou um hotfix não chega até ela.

## Riscos

- **Sincronização `main → develop` esquecida.** Consta no checklist de publicação e no fechamento da release.
- **Ruleset bloqueando a automação legítima de release.** Precisa ser testado ao configurar, criando uma tag pela automação.
- **`VERSION` alterado fora de release ou hotfix.** Coberto pelo checklist do pull request.
- **Hotfix com PATCH conflitando com o `VERSION` de uma release futura.** Regra explícita: o código entra, o `VERSION` da release não muda.

## Impactos

- **Deploy:** define o que cada ambiente recebe.
- **CI:** `validate-pr-flow.yml`, `cleanup-temporary-branches.yml`, `start-release.yml`.
- **Documentação:** `GITHUB_RELEASE_FLOW.md` é a fonte de verdade.
- **Configuração manual:** rulesets, Environments, labels e milestones em `config_user.md`.

## Plano de migração

Não se aplica.

## Referências internas

- `GITHUB_RELEASE_FLOW.md`
- `docs/DECISIONS.md` DEC-031, DEC-035, DEC-036, DEC-037, DEC-038, DEC-039
- `config_user.md`
