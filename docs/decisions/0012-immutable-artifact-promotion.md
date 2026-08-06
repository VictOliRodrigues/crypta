# ADR 0012 — Build único na RC e promoção por digest

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

Homologar em staging só tem valor se produção executar exatamente o que foi homologado.

Reconstruir a imagem para produção quebra essa garantia, mesmo partindo do mesmo commit: uma tag base de imagem que mudou, uma dependência transitiva republicada, um mirror diferente ou uma versão diferente de ferramenta produzem um artefato distinto do aprovado. A homologação passa a atestar algo que não foi implantado.

Tags móveis como `staging` e `production` têm o mesmo problema em outro lugar: apontam para conteúdos diferentes ao longo do tempo, então não servem como referência de rollback.

## Decisão

Uma release normal constrói **uma única vez**, ao publicar a release candidate.

```text
release/x.y.z → staging
    ↓
constrói Web e API
    ↓
publica no GHCR
    ↓
captura os digests
    ↓
release-manifest.json
    ↓
staging homologa esses digests
    ↓
production promove os MESMOS digests
```

Produção **não executa novo build**. O workflow de produção lê o manifesto da RC aprovada e implanta os mesmos `sha256:` já homologados.

O `release-manifest.json` registra versão, commit, imagem e digest de Web e API, horário e a migration relacionada quando houver. Não contém secrets.

Imagens oficiais no GHCR:

```text
ghcr.io/<owner>/<repository>-web
ghcr.io/<owner>/<repository>-api
```

Tags:

```text
development, dev-<sha>     desenvolvimento
vX.Y.Z-rc.N, staging       homologação
vX.Y.Z, production         produção
```

`development`, `staging` e `production` são tags móveis que indicam o último deployment — úteis para leitura humana, nunca para homologar ou promover. RCs, tags estáveis e digests são imutáveis.

Cada imagem carrega rótulos OCI com versão, revisão e data de build, e a API expõe os mesmos metadados em `GET /api/v1/version`. Depois de cada deploy, o pipeline confirma que o ambiente reporta o commit esperado.

Rollback usa uma tag estável anterior ou um digest anterior registrado. Uma versão defeituosa nunca é republicada com a mesma tag: gera-se um hotfix e uma nova versão PATCH.

## Alternativas consideradas

**Reconstruir para produção a partir da tag.** Rejeitada. É o modo mais comum de o artefato divergir do homologado, e a divergência é silenciosa.

**Promover por tag móvel (`staging` → `production`).** Rejeitada. A tag pode ter sido sobrescrita entre a aprovação e a promoção; não há garantia de qual conteúdo é implantado.

**Assinatura de imagem com cosign e verificação na implantação.** Não rejeitada — é o próximo passo natural de fortalecimento da cadeia. Fora do escopo da R1.0 para não bloquear a primeira versão, e candidata a ADR próprio.

**Registry alternativo (Docker Hub, registry próprio).** GHCR foi escolhido pela integração direta com o GitHub Actions e por manter artefato, código e permissões sob a mesma identidade.

## Consequências positivas

- O que foi homologado é literalmente o que roda em produção.
- Rollback confiável: um digest anterior é um artefato exato, não uma reconstrução.
- Auditoria completa entre commit, imagem e ambiente.
- Menos tempo de pipeline em produção, e nenhuma chance de o build de produção falhar depois da aprovação.

## Consequências negativas

- Os workflows de pré-release e de produção ficam acoplados pelo manifesto.
- Produção depende do manifesto da RC aprovada estar disponível; a retenção de artefatos passa a importar.
- Corrigir qualquer coisa depois da aprovação exige uma nova RC, não um rebuild.
- Os digests precisam ser registrados e recuperados de forma confiável.

## Riscos

- **Manifesto perdido por política de retenção.** Pendência `PEND-024`; enquanto não fechada, o manifesto deve ser anexado à Pre-release, que é permanente.
- **Imagem removida do GHCR.** As tags de RC e estáveis precisam ser preservadas; limpeza automática de packages não pode alcançá-las.
- **Tag movida manualmente.** Bloqueado por ruleset de tags `v*`.
- **Deploy aparentemente bem-sucedido executando outra versão.** Mitigado pela verificação de `/api/v1/version` após o deploy.

## Impactos

- **CI:** `publish-prerelease.yml` e `publish-production.yml`.
- **Deploy:** o Coolify referencia digests, não tags móveis, em staging e produção.
- **Documentação:** `GITHUB_RELEASE_FLOW.md` secoes 11 e 12.
- **Código:** `GET /api/v1/version` e os rótulos OCI dos `Dockerfile`.

## Plano de migração

Não se aplica.

## Referências internas

- `GITHUB_RELEASE_FLOW.md` secoes 11, 12 e 13
- `docs/DECISIONS.md` DEC-033, DEC-034, DEC-036, DEC-R011, PEND-022, PEND-024
- `docs/ARCHITECTURE.md` secao 37
