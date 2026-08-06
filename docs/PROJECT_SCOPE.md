# PROJECT_SCOPE.md

# Crypta — Escopo do Produto

> **Status:** Documento inicial para revisão  
> **Versão:** 0.2.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Objetivo do projeto

Desenvolver um cofre de senhas simples, seguro, self-hosted e multiusuário, acessível pela Web e por aplicativo Android.

O sistema será utilizado inicialmente por dois usuários, mas deverá ser estruturado para suportar mais usuários sem alterar o modelo principal do produto.

Cada usuário poderá:

- possuir cofres privados;
- acessar cofres compartilhados dos quais seja membro;
- criar e organizar sites dentro dos cofres;
- cadastrar um ou mais registros de acesso para cada site;
- consultar, copiar, criar, editar e excluir credenciais conforme suas permissões.

O projeto prioriza:

- simplicidade de uso;
- segurança;
- separação entre usuários;
- compartilhamento controlado;
- facilidade de manutenção;
- documentação contínua;
- testes automatizados;
- possibilidade de expansão futura para extensão de navegador e preenchimento automático no Android.

---

## 2. Visão resumida do domínio

A estrutura funcional principal será:

```text
Usuário
└── Cofre
    └── Site
        └── Credencial
```

Exemplo:

```text
Cofre: Pessoal
├── Google
│   ├── usuario1@gmail.com
│   └── usuario2@gmail.com
├── GitHub
│   └── victor
└── Netflix
    └── familia@email.com
```

Um site poderá possuir vários registros de credenciais.

---

## 3. Plataformas previstas

### 3.1 Aplicação Web

A aplicação Web será a interface completa do sistema.

Deverá permitir:

- autenticação;
- gerenciamento de conta;
- gerenciamento de cofres;
- gerenciamento de membros;
- gerenciamento de sites;
- gerenciamento de credenciais;
- busca;
- importação de credenciais por CSV;
- gerenciamento de sessões;
- consulta de registros de atividade previstos para a versão correspondente.

### 3.2 Aplicativo Android

O aplicativo será distribuído inicialmente por arquivo APK.

Deverá permitir:

- autenticação;
- acesso aos cofres privados e compartilhados;
- criação, visualização, edição e exclusão de cofres;
- gerenciamento de membros, conforme permissões;
- criação, visualização, edição e exclusão de sites;
- criação, visualização, edição e exclusão de credenciais;
- busca;
- cópia de usuário e senha;
- encerramento de sessão.

A importação por CSV não estará disponível no aplicativo Android.

### 3.3 Plataformas futuras

Não fazem parte da primeira entrega:

- extensão para Chrome;
- extensão para Firefox;
- extensão para Opera;
- preenchimento automático no Android;
- aplicativo para iOS;
- aplicativo desktop.

Esses clientes futuros deverão utilizar a mesma API do sistema.

---

## 4. Perfis de usuário

### 4.1 Usuário autenticado

Um usuário autenticado poderá:

- acessar seus cofres privados;
- acessar cofres compartilhados dos quais seja membro;
- criar novos cofres;
- gerenciar sites e credenciais de acordo com sua permissão;
- compartilhar cofres;
- aceitar ou recusar convites;
- sair de cofres compartilhados, quando não for o proprietário;
- consultar e revogar suas sessões.

### 4.2 Proprietário do cofre

O proprietário é o usuário que criou o cofre.

Ele poderá:

- visualizar o cofre;
- editar os dados do cofre;
- criar, editar e excluir sites;
- criar, editar e excluir credenciais;
- convidar membros;
- remover membros;
- alterar as permissões dos membros;
- excluir o cofre.

Na versão inicial, a propriedade do cofre não poderá ser transferida para outro usuário.

### 4.3 Editor do cofre

O editor poderá:

- visualizar o cofre;
- visualizar sites e credenciais;
- criar sites e credenciais;
- editar sites e credenciais;
- excluir sites e credenciais.

O editor não poderá:

- excluir o cofre;
- alterar o proprietário;
- convidar membros;
- remover membros;
- alterar permissões;
- transferir a propriedade.

### 4.4 Leitor do cofre

O perfil de leitor não faz parte da primeira versão.

Poderá ser incluído futuramente para permitir acesso somente de leitura.

---

## 5. Autenticação e contas

### 5.1 Cadastro inicial

A criação do primeiro usuário deverá ocorrer por um fluxo de configuração inicial controlado.

O sistema não deverá manter cadastro público irrestrito por padrão.

### 5.2 Novos usuários

Novos usuários poderão entrar no sistema por convite.

O convite poderá ser enviado para um endereço de e-mail ainda não cadastrado. Nesse caso, o destinatário deverá criar sua conta antes de acessar o cofre compartilhado.

O envio automático de e-mails poderá ser substituído inicialmente por um link ou código de convite, conforme definido na arquitetura.

### 5.3 Login

O login deverá utilizar:

- e-mail;
- senha da conta.

### 5.4 Logout

O usuário poderá:

- encerrar apenas a sessão atual;
- revogar outras sessões ativas;
- encerrar todas as sessões da conta.

### 5.5 Alteração de senha

O usuário autenticado poderá alterar sua senha mediante confirmação da senha atual.

### 5.6 Recuperação de acesso

A recuperação automática de senha não faz parte da primeira versão, salvo se for definida uma estratégia segura antes da implementação.

Nenhum fluxo de recuperação poderá expor ou descriptografar credenciais armazenadas indevidamente.

---

## 6. Cofres

### 6.1 Dados do cofre

Cada cofre possuirá:

- identificador;
- nome;
- descrição opcional;
- proprietário;
- data de criação;
- data da última atualização.

Cor e ícone personalizados não fazem parte da primeira versão.

### 6.2 Cofre privado

Um cofre será privado quando possuir apenas o proprietário como membro.

Somente o proprietário poderá acessá-lo.

### 6.3 Cofre compartilhado

Um cofre será considerado compartilhado quando possuir um ou mais membros além do proprietário.

O compartilhamento ocorrerá por convite.

### 6.4 Ações permitidas

Conforme sua permissão, o usuário poderá:

- criar cofre;
- listar cofres;
- visualizar cofre;
- editar nome e descrição;
- excluir cofre;
- convidar membro;
- remover membro;
- alterar permissão de membro;
- sair de cofre compartilhado.

### 6.5 Exclusão de cofre

A exclusão deverá exigir confirmação explícita.

A exclusão de um cofre removerá seus sites e credenciais de acordo com a estratégia de exclusão definida na arquitetura.

Na primeira versão, poderá ser adotada exclusão definitiva. A lixeira ficará fora do escopo inicial.

---

## 7. Sites

### 7.1 Conceito

Um site representa um serviço, sistema ou endereço para o qual existem uma ou mais credenciais.

Exemplos:

- Google;
- GitHub;
- Netflix;
- Banco;
- Painel da VPS;
- Sistema interno.

### 7.2 Dados do site

Cada site possuirá:

- identificador;
- cofre;
- nome;
- link opcional;
- data de criação;
- data da última atualização.

### 7.3 Regras do site

- O nome é obrigatório.
- O link é opcional.
- Um site pertence a apenas um cofre.
- Um site poderá possuir várias credenciais.
- Sites com o mesmo nome poderão existir em cofres diferentes.
- A duplicidade de nomes dentro do mesmo cofre será permitida inicialmente, mas a interface deverá alertar o usuário quando houver possível duplicidade.

### 7.4 Ações permitidas

Conforme sua permissão no cofre, o usuário poderá:

- criar site;
- listar sites;
- visualizar site;
- editar site;
- excluir site;
- pesquisar site pelo nome.

### 7.5 Exclusão de site

A exclusão de um site deverá exigir confirmação explícita.

A interface deverá informar que todas as credenciais vinculadas ao site também serão removidas.

---

## 8. Credenciais

### 8.1 Conceito

Uma credencial representa um registro de acesso vinculado a um site.

Um mesmo site poderá possuir vários registros de acesso.

### 8.2 Dados da credencial

Cada credencial possuirá:

- identificador;
- site;
- usuário;
- senha;
- observação opcional;
- data de criação;
- data da última atualização;
- usuário responsável pela última alteração, quando aplicável.

### 8.3 Regras dos campos

#### Usuário

- Campo obrigatório na primeira versão.
- Poderá conter e-mail, nome de usuário, número de documento ou outro identificador de acesso.
- Não deverá ser exibido integralmente em registros de auditoria.

#### Senha

- Campo obrigatório.
- Deverá permanecer oculta por padrão.
- Somente poderá ser revelada mediante ação explícita do usuário.
- Poderá ser copiada para a área de transferência.
- Nunca deverá ser registrada em logs.

#### Observação

- Campo opcional.
- Poderá armazenar instruções curtas relacionadas àquela credencial.
- Será tratada como informação sensível.
- Nunca deverá ser registrada em logs.

### 8.4 Ações permitidas

Conforme sua permissão no cofre, o usuário poderá:

- criar credencial;
- visualizar credencial;
- revelar senha;
- copiar usuário;
- copiar senha;
- editar credencial;
- excluir credencial.

### 8.5 Favoritos

Favoritos não fazem parte da primeira versão deste escopo.

Poderão ser adicionados após validação do uso real do sistema.

### 8.6 Histórico de versões

O histórico completo dos valores anteriores de uma credencial não faz parte da primeira versão.

O sistema poderá registrar que uma alteração ocorreu, sem registrar senha, observação ou outros dados sensíveis no log.

---

## 9. Busca

### 9.1 Busca no cofre

O usuário poderá pesquisar dentro de um cofre por:

- nome do site;
- usuário da credencial.

### 9.2 Busca global

A busca global entre todos os cofres acessíveis poderá ser incluída na primeira versão, desde que não comprometa o modelo de segurança definido.

Caso a arquitetura de criptografia impeça uma busca global segura no servidor, a busca deverá ocorrer no cliente ou ficar restrita ao conteúdo já carregado.

### 9.3 Observações

O conteúdo da observação não será utilizado na busca da primeira versão.

Essa decisão reduz exposição e simplifica o comportamento da pesquisa.

---

## 10. Compartilhamento

### 10.1 Convite

O proprietário poderá convidar outro usuário para um cofre.

O convite deverá conter:

- cofre;
- usuário ou e-mail convidado;
- permissão concedida;
- responsável pelo convite;
- data de criação;
- prazo de validade, se aplicável;
- status.

### 10.2 Status do convite

Os estados previstos são:

- pendente;
- aceito;
- recusado;
- cancelado;
- expirado, caso exista validade.

### 10.3 Aceite

O usuário convidado deverá aceitar o convite antes de acessar o cofre.

### 10.4 Remoção de membro

O proprietário poderá remover um editor.

Após a remoção, o usuário não poderá mais acessar o cofre nem suas credenciais.

### 10.5 Saída voluntária

Um editor poderá sair de um cofre compartilhado.

O proprietário não poderá sair do próprio cofre sem antes transferir a propriedade, recurso que não fará parte da primeira versão.

### 10.6 Auditoria

O sistema deverá registrar, sem incluir conteúdo sensível:

- criação de convite;
- aceite;
- recusa;
- cancelamento;
- alteração de permissão;
- remoção de membro;
- saída voluntária.

---

## 11. Importação por CSV

### 11.1 Disponibilidade

A importação estará disponível apenas na aplicação Web.

Não estará disponível no aplicativo Android.

### 11.2 Estrutura base

O arquivo CSV deverá aceitar as seguintes colunas:

```csv
cofre,nome,usuario,senha,obs
```

Também poderá aceitar a coluna opcional `link`:

```csv
cofre,nome,usuario,senha,obs,link
```

Significado das colunas:

| Coluna    | Obrigatória | Descrição                |
| --------- | ----------: | ------------------------ |
| `cofre`   |         Sim | Nome do cofre de destino |
| `nome`    |         Sim | Nome do site             |
| `usuario` |         Sim | Usuário da credencial    |
| `senha`   |         Sim | Senha da credencial      |
| `obs`     |         Não | Observação da credencial |
| `link`    |         Não | Link do site             |

### 11.3 Formato

A implementação deverá definir e documentar:

- codificação UTF-8;
- delimitador aceito;
- uso de cabeçalho;
- tratamento de aspas;
- tratamento de vírgulas e quebras de linha dentro de campos;
- tamanho máximo do arquivo;
- quantidade máxima de registros por importação.

O sistema deverá fornecer um arquivo modelo para download.

### 11.4 Fluxo obrigatório

A importação deverá ocorrer em etapas:

```text
Selecionar arquivo
→ Ler e validar
→ Exibir pré-visualização
→ Apontar erros e possíveis duplicidades
→ Confirmar
→ Importar
→ Exibir resultado
```

Nenhum registro deverá ser salvo antes da confirmação do usuário.

### 11.5 Validação

A pré-visualização deverá informar:

- linhas válidas;
- linhas inválidas;
- campos obrigatórios ausentes;
- cofres não encontrados;
- links inválidos;
- possíveis duplicidades;
- total previsto para importação.

### 11.6 Cofres inexistentes

Quando o nome informado na coluna `cofre` não existir entre os cofres acessíveis do usuário, o sistema deverá permitir uma das seguintes ações durante a pré-visualização:

- criar um novo cofre privado com aquele nome;
- mapear para um cofre existente;
- ignorar as linhas correspondentes.

Nenhum cofre deverá ser criado silenciosamente.

### 11.7 Cofres compartilhados

A importação para cofre compartilhado somente será permitida quando o usuário possuir permissão de edição.

### 11.8 Sites existentes

Quando o site já existir no cofre, o sistema poderá vincular a nova credencial ao site existente.

A correspondência deverá considerar, inicialmente:

- nome normalizado do site;
- cofre de destino.

### 11.9 Duplicidades

Será considerada possível duplicidade a combinação:

```text
cofre + nome do site + usuário
```

A importação não deverá sobrescrever credenciais existentes automaticamente.

Na pré-visualização, o usuário deverá escolher entre:

- ignorar a linha;
- importar como novo registro.

A atualização em massa de credenciais existentes ficará fora da primeira versão.

### 11.10 Relatório final

Após a importação, o sistema deverá informar:

- quantidade importada;
- quantidade ignorada;
- quantidade com erro;
- cofres criados;
- sites criados;
- sites reutilizados.

O relatório não deverá exibir senhas em texto aberto.

---

## 12. Registros de atividade e auditoria

O sistema deverá registrar eventos relevantes, incluindo:

- login bem-sucedido;
- tentativa de login bloqueada ou inválida;
- logout;
- revogação de sessão;
- criação, edição e exclusão de cofre;
- criação, edição e exclusão de site;
- criação, edição e exclusão de credencial;
- alterações de compartilhamento;
- importação por CSV.

Os registros não poderão conter:

- senhas;
- observações;
- tokens;
- cookies;
- cabeçalhos de autorização;
- conteúdo descriptografado;
- chaves privadas;
- segredos de aplicação.

A visualização detalhada dos logs pelo usuário poderá ser entregue em fase posterior. O registro interno dos eventos deverá existir desde a primeira versão.

---

## 13. Segurança mínima obrigatória

O sistema somente poderá ser considerado utilizável em ambiente real quando possuir:

- HTTPS obrigatório;
- armazenamento seguro da autenticação;
- proteção contra tentativas repetidas de login;
- sessões revogáveis;
- validação de entrada;
- autorização por cofre e por ação;
- isolamento entre usuários;
- proteção contra acesso direto a recursos de outro usuário;
- tratamento seguro de segredos;
- credenciais armazenadas de forma criptografada;
- ausência de informações sensíveis em logs;
- cabeçalhos de segurança;
- política segura de CORS;
- backups protegidos;
- testes de autorização e isolamento;
- ambientes development, staging e production isolados;
- banco de produção sem exposição pública;
- secrets separados por GitHub Environment;
- tags de release imutáveis;
- imagens identificadas por digest;
- promoção para produção do mesmo artefato homologado;
- rollback validado.

O modelo definitivo de criptografia está documentado em `SECURITY.md` e `ARCHITECTURE.md`.

Não será permitido colocar o sistema em uso real com credenciais verdadeiras antes da revisão e aprovação dos gates da R1.0.

---

## 14. Repositório público e governança

O código-fonte será publicado em um repositório público no GitHub.

Portanto:

- nenhum segredo poderá ser versionado;
- nenhum arquivo `.env` real poderá ser commitado;
- nenhuma credencial real poderá ser usada em testes, exemplos ou documentação;
- nenhum dump de produção poderá ser incluído;
- nenhum backup poderá ser incluído;
- nenhuma chave privada ou certificado real poderá ser incluído;
- nenhum token do Coolify ou GHCR poderá ser incluído;
- dados de teste deverão ser fictícios;
- exemplos deverão utilizar placeholders;
- qualquer segredo commitado acidentalmente deverá ser considerado comprometido e rotacionado.

O projeto deverá possuir, desde o início:

- `.gitignore`;
- `.env.example`;
- `VERSION`;
- `GITHUB_RELEASE_FLOW.md`;
- `config_user.md`;
- orientação de segurança para contribuições;
- verificação de dependências;
- secret scanning;
- branches protegidas;
- proteção das tags `v*`;
- validação automática do fluxo de pull requests.

Branches permanentes:

```text
develop
staging
main
```

A branch padrão será `develop`.

---

## 15. Infraestrutura, ambientes e artefatos

O sistema será implantado em uma VPS utilizando Coolify.

Existirão três projetos separados:

```text
crypta-development
crypta-staging
crypta-production
```

Cada projeto possuirá recursos próprios para:

- frontend Web;
- backend/API;
- MySQL.

Cada ambiente terá banco, secrets, URLs, domínios e histórico de deployment independentes.

Não será utilizado `docker-compose` como mecanismo de implantação.

Cada aplicação terá seu próprio `Dockerfile`.

As imagens Web e API serão publicadas no GHCR:

```text
ghcr.io/<owner>/<repository>-web
ghcr.io/<owner>/<repository>-api
```

O aplicativo Android consumirá a API do ambiente selecionado.

Development e staging não utilizarão credenciais reais.

---

## 16. Fluxo de desenvolvimento, homologação e produção

### Development

```text
feature/*
→ develop
→ GitHub Actions
→ GHCR
→ Coolify development
```

O ambiente será criado assim que existirem:

- primeiro endpoint;
- primeira tela;
- conexão com MySQL;
- Dockerfiles;
- CI inicial.

O objetivo é validar build, GHCR, variáveis, rede, HTTPS, CORS, frontend, API, banco e sessões.

### Staging

```text
develop
→ release/x.y.z
→ staging
→ vX.Y.Z-rc.N
→ GitHub Pre-release
```

Regras:

- `release/*` representa uma versão congelada;
- correções usam `fix/* → release/*`;
- `staging` não recebe correções diretas;
- cada promoção gera uma nova RC;
- a branch de release permanece durante a homologação.

### Production

```text
staging
→ main
→ vX.Y.Z
→ GitHub Release
→ production
→ main → develop
```

Uma release normal deverá:

1. construir Web e API na RC;
2. publicar imagens no GHCR;
3. registrar digests em `release-manifest.json`;
4. homologar esses digests;
5. promover os mesmos digests;
6. não executar novo build para produção.

### Hotfix

```text
main
→ hotfix/*
→ main
→ nova versão PATCH
→ main → develop
```

Se houver release ativa, a correção também chegará a `release/*`.

### Identificação operacional

A API deverá expor:

```text
GET /api/v1/version
```

com versão, commit, ambiente e horário do build.

O fluxo completo está em `GITHUB_RELEASE_FLOW.md`.

A configuração manual está em `config_user.md`.

## 17. Testes e qualidade

Testes não serão deixados para o final.

Cada fase deverá incluir:

- testes unitários;
- testes de integração quando aplicável;
- testes de autorização;
- testes de isolamento entre usuários;
- testes dos fluxos críticos;
- atualização da documentação;
- validação do build;
- validação no ambiente correspondente.

Fluxos críticos que exigem cobertura:

- login;
- renovação e revogação de sessão;
- acesso a cofre privado;
- acesso a cofre compartilhado;
- bloqueio de acesso sem permissão;
- CRUD de sites;
- CRUD de credenciais;
- convite e remoção de membros;
- rekey;
- importação e validação de CSV;
- publicação de imagem por commit;
- PR permitido e inválido;
- criação de RC;
- promoção dos mesmos digests;
- migration em staging;
- rollback;
- endpoint de versão.

Antes da R1.0 deverá ocorrer uma release de ensaio completa.

---

## 18. Documentação

A documentação deverá evoluir junto com o código.

Cada funcionalidade relevante somente será considerada concluída quando sua documentação correspondente estiver atualizada.

Documentos previstos:

- `README.md`;
- `CLAUDE.md`;
- `PROJECT_SCOPE.md`;
- `ARCHITECTURE.md`;
- `DATABASE.md`;
- `API.md`;
- `SECURITY.md`;
- `TELAS.md`;
- `BACKLOG.md`;
- `ROADMAP.md`;
- `CONTRIBUTING.md`;
- `DECISIONS.md`;
- `STYLE_GUIDE.md`;
- `GITHUB_RELEASE_FLOW.md`;
- `config_user.md`;
- ADRs em `docs/decisions/`.

Mudanças em branches, releases, Environments, GHCR ou Coolify deverão atualizar os documentos específicos no mesmo pull request.

## 19. Escopo da primeira versão utilizável

A primeira versão utilizável deverá possuir:

### Conta e autenticação

- criação controlada de conta;
- login;
- logout;
- alteração de senha;
- sessões revogáveis.

### Cofres

- criação;
- listagem;
- edição;
- exclusão;
- cofre privado;
- cofre compartilhado;
- convites;
- permissões de proprietário e editor.

### Sites

- criação;
- listagem;
- visualização;
- edição;
- exclusão;
- nome obrigatório;
- link opcional.

### Credenciais

- criação;
- visualização;
- edição;
- exclusão;
- usuário;
- senha;
- observação opcional;
- revelar senha;
- copiar usuário;
- copiar senha.

### Busca

- busca por nome do site;
- busca por usuário.

### Importação Web

- seleção local de CSV;
- pré-visualização;
- validação;
- tratamento de cofres inexistentes;
- identificação de possíveis duplicidades;
- confirmação;
- relatório final;
- ausência de upload do CSV em texto aberto.

### Web

- acesso completo às funcionalidades da primeira versão.

### Android

- acesso e gerenciamento das funcionalidades principais;
- instalação por APK assinado;
- sem importação por CSV;
- sem preenchimento automático.

### API

- health;
- readiness;
- version;
- Swagger;
- contratos versionados;
- erros padronizados;
- idempotência;
- concorrência;
- auditoria.

### Segurança e operação

- criptografia no cliente;
- HTTPS;
- autorização;
- rate limit;
- auditoria;
- testes;
- documentação;
- MySQL sem porta pública;
- backups;
- restauração;
- rollback;
- três ambientes separados;
- secrets separados;
- GitHub Actions;
- GHCR;
- RC homologada;
- produção pelo mesmo digest;
- tag estável;
- GitHub Release;
- endpoint `/api/v1/version`.

### Entrega R1.0

```text
develop
→ release/1.0.0
→ staging
→ v1.0.0-rc.N
→ homologação
→ main
→ v1.0.0
→ production
→ main → develop
```

Credenciais reais somente poderão ser adicionadas depois da aprovação desse fluxo e dos gates de segurança.

## 20. Fora do escopo da primeira versão

Não serão desenvolvidos inicialmente:

- chaves SSH;
- API keys como tipo específico;
- cartões;
- documentos;
- anexos;
- arquivos;
- notas independentes;
- códigos TOTP;
- autenticação por passkey;
- autenticação por chave física;
- preenchimento automático no Android;
- extensão de navegador;
- aplicativo para iOS;
- aplicativo desktop;
- modo offline;
- sincronização offline;
- favoritos;
- tags;
- pastas dentro dos cofres;
- lixeira;
- restauração de itens excluídos;
- histórico completo de versões;
- transferência de propriedade;
- perfil de leitor;
- importação pelo aplicativo Android;
- exportação;
- atualização em massa via CSV;
- cadastro público irrestrito;
- cobrança;
- planos;
- organizações empresariais;
- múltiplos níveis avançados de permissão.

---

## 21. Critérios de sucesso

O projeto será considerado bem-sucedido quando os usuários conseguirem:

1. Entrar com segurança pela Web e pelo Android.
2. Criar cofres privados.
3. Compartilhar um cofre com outro usuário.
4. Manter cofres pessoais separados.
5. Criar sites dentro dos cofres.
6. Armazenar várias credenciais dentro de um mesmo site.
7. Consultar e copiar usuários e senhas.
8. Editar e excluir registros conforme suas permissões.
9. Importar registros por CSV pela Web com pré-visualização.
10. Utilizar o sistema sem exposição de dados entre usuários.
11. Revogar sessões.
12. Acessar development, staging e production de forma isolada.
13. Identificar a versão implantada por versão, commit e ambiente.
14. Homologar uma RC sem interromper a evolução de `develop`.
15. Publicar produção com os mesmos digests aprovados em staging.
16. Executar rollback para uma versão identificada.
17. Restaurar o banco a partir de backup testado.
18. Executar testes automatizados e consultar documentação atualizada.

O processo será considerado bem-sucedido quando:

- nenhum PR inválido puder promover código;
- tags publicadas forem imutáveis;
- `release/*` permanecer durante homologação;
- correções de staging retornarem à branch de release;
- hotfixes retornarem a `develop` e à release ativa;
- a R1.0 for publicada como GitHub Release estável.

---

## 22. Princípios de priorização

Durante o desenvolvimento, as decisões deverão seguir esta ordem:

1. Segurança.
2. Correção de permissões e isolamento.
3. Integridade dos dados.
4. Reprodutibilidade da entrega.
5. Simplicidade.
6. Usabilidade.
7. Desempenho.
8. Novas funcionalidades.

Funcionalidades não previstas neste documento não deverão ser adicionadas automaticamente.

Qualquer ampliação relevante de escopo deverá:

- ser registrada no backlog;
- ser analisada quanto ao impacto em segurança;
- atualizar este documento;
- atualizar arquitetura, banco, API, telas e testes quando aplicável;
- atualizar o fluxo de releases quando houver impacto;
- atualizar `config_user.md` quando exigir configuração manual.

## 23. Resumo do produto

O produto inicial é um cofre de senhas multiusuário, self-hosted e com dois clientes:

- aplicação Web;
- aplicativo Android instalado por APK.

O núcleo do sistema é:

```text
Usuários
→ Cofres privados ou compartilhados
→ Sites com link opcional
→ Múltiplas credenciais
→ Usuário, senha e observação
```

A importação por CSV existirá somente na Web.

Extensões de navegador e preenchimento automático no Android serão considerados após a estabilização da primeira versão.
