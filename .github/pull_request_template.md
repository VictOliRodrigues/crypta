<!--
Antes de abrir: confirme que a combinação origem -> destino é permitida.
O workflow "Validar origem e destino" bloqueia o merge caso não seja.
Ver GITHUB_RELEASE_FLOW.md secao 5.
-->

## Objetivo

<!-- O que este PR resolve e por quê. -->

## Mudanças

<!-- Principais arquivos e comportamento implementado. -->

## Impacto de segurança

<!--
Responda mesmo que a resposta seja "nenhum".
- Alguma autorização foi adicionada ou alterada?
- Algum dado sensível passou a trafegar, ser persistido ou ser logado?
- Alguma dependência de crypto, auth, cookie, storage ou parser mudou?
-->

## Testes

<!-- Testes criados ou atualizados e o comando executado. -->

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Documentação

<!-- Documentos atualizados. Ver CLAUDE.md secao 56. -->

## Migrations

<!-- Migration criada? Testada em banco vazio e em banco existente? Rollback? -->

## Ambiente afetado e rollback

<!-- development / staging / production. Como reverter se necessário. -->

## Checklist

- [ ] Nenhum segredo, dump, backup ou dado real foi incluído.
- [ ] `VERSION` só foi alterado se este PR inicia uma release ou um hotfix.
- [ ] Labels e milestone aplicados.
- [ ] A estratégia de merge está correta para este fluxo.
