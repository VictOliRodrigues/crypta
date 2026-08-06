# ADR 0013 — Licença AGPL-3.0

## Status

ACCEPTED

## Data

2026-08-06

## Contexto

O repositório é público desde a R0, e `ARCHITECTURE.md` secao 40.1 lista a licença entre os arquivos obrigatórios. Até aqui não existia arquivo `LICENSE`, e `package.json` declarava `UNLICENSED`.

A ausência de licença não é neutra: sem ela, a lei de direito autoral aplica-se integralmente e ninguém tem permissão para usar, copiar, modificar ou redistribuir o código, ainda que ele esteja visível. Na prática, o `CONTRIBUTING.md` inteiro ficava sem efeito jurídico — não há como aceitar contribuição para algo que ninguém pode legalmente derivar.

O produto tem uma característica que pesa na escolha: é um cofre de senhas self-hosted. O usuário confia que o código que está rodando é o código que ele consegue auditar. Um terceiro que pegue este projeto, enfraqueça a derivação de chaves ou o modelo de envelopes, e ofereça o resultado como serviço hospedado, produz exatamente o cenário que `SECURITY.md` trata como ameaça — um frontend malicioso que o usuário não tem como inspecionar.

Licenças permissivas não impedem isso. Copyleft comum (GPL-3.0) também não, porque oferecer software como serviço não é distribuição e não dispara a obrigação de publicar o fonte.

## Decisão

O projeto é licenciado sob **GNU Affero General Public License v3.0 only** (`AGPL-3.0-only`).

O arquivo `LICENSE` contém a cópia literal do texto da FSF, obtida de <https://www.gnu.org/licenses/agpl-3.0.txt>, sem qualquer alteração — 661 linhas, 34 523 bytes, SHA-256 `0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0`. O texto está em `.prettierignore`: reformatar um documento juridicamente operativo o descaracteriza.

`package.json` declara o identificador SPDX `AGPL-3.0-only`. A variante `-only` é deliberada: `AGPL-3.0-or-later` delegaria a versões futuras da licença, ainda não escritas, o poder de mudar os termos deste projeto.

A cláusula decisiva é a secao 13, _Remote Network Interaction_: quem modificar o Crypta e permitir que usuários interajam com ele remotamente precisa oferecer a esses usuários o código-fonte correspondente.

## Alternativas consideradas

**MIT.** Rejeitada. É a licença de maior adoção e menor atrito, mas não oferece concessão expressa de patente e não impõe reciprocidade alguma. Um fork fechado com criptografia alterada poderia ser oferecido como serviço sem nunca publicar as mudanças.

**Apache-2.0.** Rejeitada, embora fosse a melhor permissiva para este caso — tem concessão expressa de patente e proteção de marca. Falha pelo mesmo motivo do MIT: não cobre uso em rede.

**GPL-3.0.** Rejeitada. Tem o copyleft, mas a obrigação depende de distribuição. Software oferecido como serviço não é distribuído, e a brecha cobre justamente o modo como um cofre de senhas alterado chegaria ao usuário.

**Nenhuma licença.** Rejeitada. É o estado atual e equivale a "todos os direitos reservados", incompatível com repositório público que aceita contribuições.

## Consequências positivas

- Quem hospedar uma versão modificada do Crypta precisa publicar as modificações; o usuário desse serviço pode auditar o que está rodando.
- Concessão expressa de patente, herdada da GPLv3.
- Contribuições passam a ter base jurídica, tornando o `CONTRIBUTING.md` efetivo.
- Alinhamento com o ecossistema de cofres de senha open source, onde AGPL é o padrão de fato.

## Consequências negativas

- Diversas empresas proíbem AGPL em política interna, mesmo para uso interno. Isso reduz adoção corporativa.
- Incompatível com incorporação em produtos proprietários — inclusive por decisão futura do próprio autor, que precisaria de acordo de todos os contribuidores para relicenciar.
- Exige atenção ao integrar dependências: código sob licença incompatível não pode ser incorporado.

## Riscos

- **Relicenciamento futuro fica caro.** Uma vez que existam contribuidores externos, mudar de licença exige concordância de todos. Mitigação possível, se algum dia for desejada: exigir CLA antes de aceitar a primeira contribuição externa. Não adotado agora, porque CLA afasta contribuidores e o projeto não pretende relicenciar.
- **Dependências incompatíveis entrando sem revisão.** O `pnpm audit` não avalia licença. Verificar licença faz parte do checklist de dependências em `CLAUDE.md` secao 59; um passo automatizado de verificação de licença é candidato para a R0.8.
- **Aplicabilidade da secao 13 depende de fiscalização.** A licença cria a obrigação, não a garantia. Não há capacidade de litígio neste projeto; o efeito prático é dissuasório e reputacional.

## Impactos

- **Código:** `LICENSE` na raiz; campo `license` em `package.json`.
- **Documentação:** `README.md`, `docs/DECISIONS.md` (PEND-016 fechada, DEC-040 registrada), `docs/BACKLOG.md`.
- **Deploy:** nenhum. As imagens publicadas no GHCR carregam a licença junto com o código.
- **Segurança:** reforça o modelo de confiança de `SECURITY.md` para versões hospedadas por terceiros.

## Plano de migração

Não se aplica. Nenhuma versão foi publicada sob outra licença e não existe contribuição externa. O histórico anterior declarava `UNLICENSED`, o que não concedia direito algum — a mudança apenas amplia permissões e não retira nada de ninguém.

## Referências internas

- `docs/DECISIONS.md` DEC-040, PEND-016
- `docs/ARCHITECTURE.md` secao 40.1
- `SECURITY.md` — modelo de ameaça de frontend hospedado por terceiro
- `CONTRIBUTING.md`
