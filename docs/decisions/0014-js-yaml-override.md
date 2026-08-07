# ADR 0014 — Override de `js-yaml` para a versão corrigida

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

O job `Auditoria de dependências` do `ci.yml` roda `pnpm audit --audit-level high`. Uma vulnerabilidade alta em dependência bloqueia o merge — comportamento deliberado, registrado em `ROADMAP.md` secao 42, porque o produto armazena credenciais.

Em 7 de agosto de 2026 esse job passou a falhar com [GHSA-pm4m-ph32-ghv5](https://github.com/advisories/GHSA-pm4m-ph32-ghv5): `js-yaml` entre `5.0.0` e `5.2.1` analisa _flow collections_ em tempo exponencial, e um documento YAML construído para isso causa negação de serviço. A versão corrigida é `5.2.2`.

A cópia vulnerável entra por `@nestjs/swagger`, que declara `js-yaml` com versão **exata**, `"5.2.1"`, e não uma faixa. Não existe versão do pacote pai que corrija: `11.4.6` é a última publicada no registro, e as anteriores usam `js-yaml` 4.x, que ficou para trás em outros aspectos.

O `js-yaml` do `@nestjs/swagger` serve para serializar e analisar o documento OpenAPI, não entrada de usuário. A exploração exigiria que um documento YAML hostil chegasse a esse caminho, o que a superfície atual da API não oferece. Isso reduz a urgência prática, mas não muda a decisão: o portão da CI existe justamente para não depender dessa avaliação caso a caso, que envelhece mal quando a superfície da API cresce.

`@nestjs/swagger` não é substituível por decisão própria — Swagger/OpenAPI faz parte da stack fixa em `CLAUDE.md` secao 4.

## Decisão

Adicionar um override em `pnpm-workspace.yaml` forçando a versão corrigida:

```yaml
overrides:
  'js-yaml@5.2.1': '^5.2.3'
```

O seletor inclui a versão, não apenas o nome do pacote. A árvore de dependências também contém `js-yaml` 3.15.1 e 4.3.1, ambas fora da faixa que o advisory cobre; o seletor com versão deixa as duas intactas.

O resultado é uma alteração de uma linha no `pnpm-lock.yaml`: `js-yaml@5.2.1` passa a `js-yaml@5.2.3`.

## Alternativas consideradas

**Atualizar `@nestjs/swagger`.** Impossível hoje. A `11.4.6` é a última versão publicada e é justamente a que crava `5.2.1`.

**Trocar `@nestjs/swagger` por outra biblioteca de OpenAPI.** Rejeitada. Swagger é stack fixa; substituir exigiria ADR próprio, e trocar uma dependência inteira para contornar um advisory de uma transitiva é desproporcional.

**Baixar o `--audit-level` ou adicionar exceção ao advisory.** Rejeitada. Esvazia o portão para todas as vulnerabilidades altas futuras, não só esta. `CLAUDE.md` secao 89 define que segurança prevalece sobre rapidez.

**Override pelo nome do pacote, `'js-yaml': '^5.2.3'`.** Rejeitada. Arrastaria também `js-yaml` 3.15.1 e 4.3.1 para a linha 5.x — um salto de major para pacotes que o advisory nem cobre, com risco de quebra sem ganho de segurança.

**Esperar o upstream corrigir o pin.** Rejeitada como solução, mantida como plano de saída. Deixaria `develop` com a CI vermelha por tempo indeterminado, e a R0 não fecha com o gate vermelho.

## Consequências positivas

- `pnpm audit --audit-level high` volta a reportar ausência de vulnerabilidades conhecidas, e o portão da CI recupera o poder de bloqueio.
- A correção é real, não uma supressão: a versão vulnerável deixa de ser instalada.
- O impacto é mínimo e auditável — uma linha no lockfile.
- `js-yaml` 3.x e 4.x permanecem nas versões que já estavam.

## Consequências negativas

- Um override congela a resolução daquela dependência. Enquanto a entrada existir, atualizações do `js-yaml` promovidas pelo pai deixam de ser observadas.
- Cria um ponto de manutenção que nenhuma automação vigia: o Dependabot não remove overrides obsoletos.
- Introduz divergência entre o que `@nestjs/swagger` declara e o que roda de fato, o que pode confundir a leitura de um `pnpm why` futuro.

## Riscos

- **Override esquecido.** É o risco principal. Um override que sobrevive ao motivo que o criou esconde correções posteriores e pode, com o tempo, fixar uma versão mais antiga do que a que o pai já usaria. Mitigação: o motivo está escrito em comentário no `pnpm-workspace.yaml`, junto da instrução de remover a entrada, e este ADR registra o critério de saída.
- **Incompatibilidade de API entre 5.2.1 e 5.2.3.** São versões patch da mesma minor e a expectativa semver é de compatibilidade, mas a garantia aqui é empírica, não contratual: os testes da API e o build passaram com a versão nova.
- **Novo advisory na linha 5.x.** Se `5.2.3` for afetada mais adiante, a faixa `^5.2.3` permite subir dentro da minor sem tocar neste arquivo; um advisory que exija outra major voltaria a exigir decisão.

## Impactos

- **Código:** nenhum. Nenhum arquivo do projeto importa `js-yaml`.
- **Banco:** nenhum.
- **API:** `@nestjs/swagger` passa a resolver `js-yaml` 5.2.3. Verificado: os 18 testes da API passam e o build da API conclui.
- **Segurança:** fecha GHSA-pm4m-ph32-ghv5. `pnpm audit --audit-level high` reporta ausência de vulnerabilidades conhecidas.
- **Deploy:** a imagem da API passa a conter `js-yaml` 5.2.3. Nenhuma mudança de configuração ou variável.

## Plano de migração

Não há migração de dados nem de formato. A entrada é removida quando o upstream corrigir o pin:

1. acompanhar as versões de `@nestjs/swagger` posteriores à `11.4.6`;
2. quando alguma declarar `js-yaml` em versão igual ou superior a `5.2.2`, remover a entrada de `overrides` em `pnpm-workspace.yaml`;
3. rodar `pnpm install` e confirmar com `pnpm why js-yaml` que a resolução vem do pai, não do override;
4. rodar `pnpm audit --audit-level high` e `pnpm verify`;
5. marcar este ADR como `SUPERSEDED` apenas se a decisão mudar de forma; a simples remoção do override é execução do plano, não decisão nova.

## Referências internas

- `pnpm-workspace.yaml` — a entrada e o comentário com o motivo.
- `.github/workflows/ci.yml` — job `Auditoria de dependências`.
- `ROADMAP.md` secao 42 — vulnerabilidade alta bloqueia o merge.
- `CLAUDE.md` secao 4 — Swagger/OpenAPI como stack fixa.
- `CLAUDE.md` secao 59 e 60 — checklist de dependências e dependências críticas.
- `CONTRIBUTING.md` secao 20 — regras para dependências.
- [ADR 0007](0007-rest-api.md) — API REST versionada, que motiva o uso do Swagger.
