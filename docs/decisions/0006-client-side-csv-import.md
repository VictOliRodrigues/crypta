# ADR 0006 — Importação CSV processada no navegador

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O primeiro uso real do produto é migrar credenciais que hoje estão em outro lugar. Um CSV exportado de outro gerenciador contém senhas em texto aberto — é o arquivo mais sensível que o sistema vai tocar.

O caminho tradicional seria enviar o arquivo para a API processar. Isso colocaria todas as senhas do usuário em texto aberto no servidor: em memória, possivelmente em disco temporário, possivelmente em log de acesso, e certamente sujeitas ao que estiver comprometido no servidor naquele momento.

Além disso, a detecção de duplicidades precisa comparar o conteúdo do CSV com o que já existe no cofre — e o servidor não consegue ler o que já existe (ADR 0003).

## Decisão

O CSV é processado inteiramente no navegador. O arquivo nunca é enviado à API.

```text
Selecionar arquivo
→ Parser local (memória)
→ Validação local
→ Pré-visualização
→ Resolver cofres inexistentes
→ Resolver duplicidades
→ Criptografar sites e credenciais
→ Enviar lote criptografado
→ Relatório
```

Formato aceito:

```csv
cofre,nome,usuario,senha,obs,link
```

`obs` e `link` são opcionais.

Nenhum registro é gravado antes da confirmação explícita do usuário. A pré-visualização informa linhas válidas e inválidas, campos obrigatórios ausentes, cofres não encontrados, links inválidos, possíveis duplicidades e o total previsto.

Duplicidade é a combinação `cofre + nome normalizado do site + usuário normalizado`, calculada no cliente depois de descriptografar o cofre de destino. A importação nunca sobrescreve automaticamente: o usuário escolhe ignorar a linha ou importar como novo registro.

Cofre inexistente nunca é criado silenciosamente: o usuário escolhe criar, mapear para um cofre existente ou ignorar as linhas.

O lote enviado à API contém um `importId` idempotente e apenas entidades já criptografadas.

O parser trata todo conteúdo como texto, incluindo células que começam com `=`, `+`, `-` ou `@`, para não reintroduzir fórmulas ao exportar.

Não existe endpoint de upload de CSV. A funcionalidade não estará disponível no Android na V1.

## Alternativas consideradas

**Upload para a API processar.** Rejeitada. Exporia todas as senhas do usuário ao servidor de uma vez — o pior caso possível de exposição neste produto.

**Upload criptografado do arquivo inteiro, para o servidor devolver ao cliente processar.** Rejeitada. Adiciona um armazenamento temporário sem resolver nada: o processamento continuaria no cliente.

**Importação também no Android.** Adiada. A pré-visualização com resolução de conflitos é uma tela densa, melhor em tela grande, e concentrar o parser em uma plataforma reduz a superfície de erro.

## Consequências positivas

- O servidor nunca vê o CSV nem as senhas em texto aberto.
- A pré-visualização opera sobre o conteúdo real do cofre, então a detecção de duplicidade é precisa.
- O `importId` idempotente torna reenvio seguro depois de uma falha de rede.

## Consequências negativas

- Arquivos grandes consomem memória do navegador; são necessários limites de tamanho e de linhas.
- O parser precisa ser implementado e testado no cliente, incluindo aspas, vírgulas e quebras de linha dentro de campos.
- A API não pode validar o conteúdo do que recebe — apenas autorização, estrutura e limites.
- Sem importação no Android na V1.

## Riscos

- **Memória em arquivos grandes.** Mitigado por limites explícitos, validados no cliente e novamente na API. Valores exatos em `PEND-010`.
- **Conteúdo do CSV vazando por log do navegador ou mensagem de erro.** Nenhuma linha do arquivo pode ser incluída em log, toast ou relatório.
- **Dados temporários permanecendo em memória depois da importação.** As referências precisam ser limpas ao concluir.
- **Falha parcial em lote grande.** Preferência inicial: transação independente por cofre, com relatório por cofre.

## Impactos

- **Código:** `apps/web/src/features/import`.
- **API:** `/imports` recebe apenas lote criptografado com `importId`.
- **Segurança:** nenhum endpoint aceita CSV.
- **Documentação:** `PROJECT_SCOPE.md` secao 11.

## Plano de migração

Não se aplica.

## Referências internas

- `docs/PROJECT_SCOPE.md` secao 11
- `docs/ARCHITECTURE.md` secao 27
- `docs/DECISIONS.md` DEC-015, DEC-023, DEC-R006, PEND-010, PEND-018
- `CLAUDE.md` secoes 26 e 83
