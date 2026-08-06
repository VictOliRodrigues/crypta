# TELAS.md

# Cofre de Senhas — Especificação de Telas

> **Status:** Documento inicial para revisão  
> **Versão:** 0.1.0  
> **Última atualização:** 30 de julho de 2026

---

## 1. Objetivo

Este documento descreve as telas da aplicação Web e do aplicativo Android do cofre de senhas.

A finalidade é servir como referência para:

- design da interface;
- prototipação;
- geração de telas no Stitch;
- desenvolvimento frontend;
- desenvolvimento mobile;
- validação funcional;
- testes de interface;
- documentação do produto.

O documento deve ser utilizado em conjunto com:

- `PROJECT_SCOPE.md`;
- `ARCHITECTURE.md`;
- `DATABASE.md`;
- `API.md`;
- `SECURITY.md`.

---

## 2. Princípios de interface

A interface deve transmitir:

- segurança;
- simplicidade;
- clareza;
- rapidez;
- baixo nível de distração;
- consistência entre Web e Android.

Evitar:

- excesso de cores;
- animações desnecessárias;
- ícones sem legenda em ações críticas;
- excesso de informações em uma mesma tela;
- menus profundos;
- textos técnicos para o usuário final;
- exposição acidental de senhas.

---

## 3. Direção visual

### 3.1 Estilo

A interface deve possuir aparência:

- moderna;
- minimalista;
- profissional;
- limpa;
- adequada a um sistema de segurança.

Referências conceituais:

- layouts de gerenciadores de senha;
- painéis administrativos modernos;
- foco em legibilidade;
- navegação previsível.

### 3.2 Cores

Utilizar uma paleta neutra com uma cor principal de destaque.

Sugestão:

- fundo claro: branco ou cinza muito claro;
- fundo escuro: grafite ou azul muito escuro;
- cor principal: azul, verde ou roxo discreto;
- sucesso: verde;
- alerta: amarelo;
- erro: vermelho;
- texto principal: alto contraste;
- texto secundário: cinza médio.

A cor principal deverá ser definida no design system do projeto.

### 3.3 Tipografia

Utilizar fonte sem serifa e de boa legibilidade.

Requisitos:

- títulos claros;
- corpo de texto confortável;
- labels sempre visíveis;
- não depender apenas de placeholder;
- contraste adequado;
- tamanhos responsivos.

### 3.4 Ícones

Utilizar ícones consistentes para:

- cofre;
- site;
- usuário;
- senha;
- copiar;
- editar;
- excluir;
- compartilhar;
- importar;
- configurações;
- sessões;
- sair.

Ações críticas devem possuir texto além do ícone.

---

## 4. Componentes globais

### 4.1 Botões

Tipos:

- primário;
- secundário;
- terciário;
- perigo;
- ícone;
- texto.

Estados:

- normal;
- hover;
- foco;
- pressionado;
- desabilitado;
- carregando.

### 4.2 Campos

Tipos:

- texto;
- e-mail;
- senha;
- URL;
- textarea;
- busca;
- seleção;
- upload de arquivo.

Estados:

- vazio;
- preenchido;
- foco;
- erro;
- sucesso;
- desabilitado;
- somente leitura.

### 4.3 Mensagens

Tipos:

- toast de sucesso;
- toast de erro;
- aviso;
- confirmação;
- erro em campo;
- erro geral;
- estado vazio;
- carregamento.

### 4.4 Diálogos

Todo diálogo deve possuir:

- título;
- descrição;
- ação principal;
- ação de cancelar;
- foco inicial correto;
- fechamento por teclado na Web;
- comportamento responsivo.

### 4.5 Senhas

Senhas devem:

- permanecer ocultas por padrão;
- possuir botão de revelar;
- possuir botão de copiar;
- voltar a ficar ocultas após sair da tela;
- não aparecer em toasts;
- não aparecer em URLs;
- não aparecer em logs visuais.

---

# PARTE I — APLICAÇÃO WEB

---

## 5. Estrutura geral da Web

### 5.1 Layout autenticado

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Topbar: busca global | ações | perfil                      │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Conteúdo principal                          │
│               │                                             │
│ Cofres        │                                             │
│ Convites      │                                             │
│ Importar      │                                             │
│ Configurações │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Tablet:

- sidebar recolhível;
- conteúdo com largura adaptada;
- ações secundárias agrupadas.

Mobile Web:

- menu lateral em drawer;
- topbar simplificada;
- botões principais ocupando largura adequada;
- tabelas convertidas em cards.

### 5.2 Navegação principal

Itens:

- Cofres;
- Convites;
- Importar CSV;
- Configurações.

A importação deve aparecer apenas na Web.

---

## 6. Tela W01 — Configuração inicial

### Objetivo

Permitir a criação controlada do primeiro usuário do sistema.

### Quando aparece

Somente quando o sistema ainda não possui usuários cadastrados.

### Elementos

- logo;
- título: `Configurar cofre`;
- texto explicativo curto;
- campo `Nome`;
- campo `E-mail`;
- campo `Senha`;
- campo `Confirmar senha`;
- indicador de requisitos da senha;
- checkbox de confirmação dos termos do projeto, caso exista;
- botão `Criar conta inicial`.

### Campos

#### Nome

- obrigatório;
- mínimo de 2 caracteres;
- máximo definido pelo backend.

#### E-mail

- obrigatório;
- validar formato;
- converter para minúsculas quando aplicável.

#### Senha

- obrigatória;
- botão revelar/ocultar;
- mostrar requisitos;
- não mostrar a senha em texto fora do campo.

#### Confirmar senha

- obrigatória;
- validar igualdade.

### Botões

- `Criar conta inicial`.

### Estados

- carregando;
- erro de validação;
- erro do servidor;
- configuração concluída.

### Fluxo de sucesso

```text
Configuração inicial
→ Conta criada
→ Login automático ou redirecionamento para Login
```

---

## 7. Tela W02 — Login

### Objetivo

Autenticar um usuário existente.

### Elementos

- logo;
- título: `Entrar`;
- campo `E-mail`;
- campo `Senha`;
- botão revelar senha;
- botão `Entrar`;
- mensagem sobre acesso somente por convite;
- versão da aplicação, opcional.

### Campos

#### E-mail

- obrigatório;
- teclado apropriado em dispositivos móveis;
- autocomplete de e-mail permitido.

#### Senha

- obrigatória;
- oculta por padrão;
- autocomplete seguro permitido.

### Botões

- `Entrar`.

### Mensagens

- credenciais inválidas;
- conta indisponível;
- excesso de tentativas;
- erro de conexão;
- sessão expirada.

### Estados

- formulário normal;
- carregando;
- erro;
- bloqueio temporário.

### Fluxo de sucesso

```text
Login
→ Dashboard de cofres
```

---

## 8. Tela W03 — Aceitar convite e criar conta

### Objetivo

Permitir que um usuário convidado crie sua conta e aceite um convite.

### Elementos

- logo;
- título: `Você foi convidado`;
- nome do cofre;
- e-mail convidado;
- nome de quem convidou;
- permissão oferecida;
- campo `Nome`;
- campo `Senha`;
- campo `Confirmar senha`;
- botão `Criar conta e aceitar`;
- botão `Recusar convite`.

### Regras

- e-mail deve aparecer como somente leitura;
- token de convite não deve ser exibido;
- convite inválido deve gerar estado específico;
- convite expirado deve gerar estado específico.

### Estados

- convite válido;
- convite expirado;
- convite cancelado;
- convite já utilizado;
- erro de rede;
- carregando.

---

## 9. Tela W04 — Aceitar convite com conta existente

### Objetivo

Permitir que um usuário autenticado aceite ou recuse um convite.

### Elementos

- nome do cofre;
- proprietário;
- permissão;
- data do convite;
- botão `Aceitar`;
- botão `Recusar`.

### Fluxo

```text
Convite pendente
→ Aceitar
→ Cofre passa a aparecer na lista
```

---

## 10. Tela W05 — Dashboard de cofres

### Objetivo

Apresentar todos os cofres acessíveis ao usuário.

### Elementos

- título: `Meus cofres`;
- botão `Novo cofre`;
- campo de busca;
- filtro:
  - todos;
  - privados;
  - compartilhados;
- lista ou grid de cofres;
- indicador de convites pendentes;
- estado vazio.

### Card de cofre

Cada card deve exibir:

- nome;
- descrição resumida;
- tipo:
  - privado;
  - compartilhado;
- quantidade de sites;
- papel do usuário:
  - proprietário;
  - editor;
- data da última atualização;
- menu de ações.

### Ações do card

Proprietário:

- abrir;
- editar;
- compartilhar;
- excluir.

Editor:

- abrir;
- sair do cofre.

### Botões

- `Novo cofre`;
- `Ver convites`, quando houver;
- `Abrir cofre`.

### Estado vazio

Texto:

`Você ainda não possui cofres.`

Ação:

- `Criar primeiro cofre`.

### Estados

- carregando;
- erro;
- sem cofres;
- sem resultado de busca;
- lista preenchida.

---

## 11. Modal W06 — Criar cofre

### Objetivo

Criar um novo cofre privado.

### Campos

- `Nome`;
- `Descrição`, opcional.

### Botões

- `Cancelar`;
- `Criar cofre`.

### Validações

- nome obrigatório;
- remover espaços excedentes;
- limite de caracteres;
- descrição com limite.

### Resultado

O novo cofre deve ser criado como privado e o usuário atual deve ser o proprietário.

---

## 12. Modal W07 — Editar cofre

### Objetivo

Alterar nome e descrição.

### Campos

- `Nome`;
- `Descrição`.

### Botões

- `Cancelar`;
- `Salvar alterações`.

### Permissão

Somente o proprietário.

---

## 13. Modal W08 — Excluir cofre

### Objetivo

Confirmar a exclusão definitiva.

### Conteúdo

- nome do cofre;
- aviso de impacto;
- quantidade de sites;
- quantidade de credenciais;
- campo de confirmação digitada, opcional;
- botão `Cancelar`;
- botão `Excluir cofre`.

### Texto de aviso

`Esta ação removerá o cofre, seus sites e suas credenciais. A exclusão não poderá ser desfeita.`

### Regras

- botão de excluir destacado como perigo;
- não fechar acidentalmente durante a exclusão;
- somente proprietário.

---

## 14. Tela W09 — Detalhes do cofre

### Objetivo

Exibir os sites existentes dentro de um cofre.

### Cabeçalho

- nome do cofre;
- descrição;
- indicador:
  - privado;
  - compartilhado;
- papel do usuário;
- botão `Novo site`;
- botão `Compartilhar`, somente proprietário;
- menu de ações.

### Busca

Campo:

- `Buscar por site ou usuário`.

### Lista de sites

Cada item deve exibir:

- nome do site;
- link, se houver;
- quantidade de credenciais;
- última atualização;
- botão abrir;
- menu de ações.

### Ações

- abrir;
- editar;
- excluir.

### Estado vazio

Texto:

`Este cofre ainda não possui sites.`

Botão:

- `Adicionar primeiro site`.

### Sem resultado

Texto:

`Nenhum site ou usuário corresponde à busca.`

### Estados

- carregando;
- erro;
- vazio;
- preenchido;
- busca sem resultado.

---

## 15. Modal W10 — Criar site

### Objetivo

Cadastrar um site dentro do cofre.

### Campos

#### Nome

- obrigatório;
- exemplo: `Google`.

#### Link

- opcional;
- exemplo: `https://accounts.google.com`;
- validar URL;
- aceitar `http` e `https`;
- preferir `https`.

### Botões

- `Cancelar`;
- `Criar site`.

### Regras

- alertar sobre possível nome duplicado;
- não impedir duplicidade automaticamente;
- manter o cofre de destino visível.

---

## 16. Modal W11 — Editar site

### Objetivo

Editar nome e link.

### Campos

- `Nome`;
- `Link`.

### Botões

- `Cancelar`;
- `Salvar alterações`.

---

## 17. Modal W12 — Excluir site

### Objetivo

Confirmar exclusão do site e de suas credenciais.

### Conteúdo

- nome do site;
- quantidade de credenciais;
- aviso de exclusão;
- botão `Cancelar`;
- botão `Excluir site`.

### Texto de aviso

`Todas as credenciais vinculadas a este site também serão removidas.`

---

## 18. Tela W13 — Detalhes do site

### Objetivo

Exibir os dados do site e sua lista de credenciais.

### Cabeçalho

- nome do site;
- link;
- botão `Abrir site`, quando houver link;
- botão `Editar site`;
- botão `Nova credencial`;
- menu de ações.

### Lista de credenciais

Cada card ou linha deve exibir:

- usuário;
- observação resumida, se houver;
- senha mascarada;
- data da última atualização;
- botão copiar usuário;
- botão copiar senha;
- botão abrir detalhes;
- menu de ações.

### Ações

- revelar senha;
- copiar usuário;
- copiar senha;
- editar;
- excluir.

### Estado vazio

Texto:

`Nenhuma credencial cadastrada para este site.`

Botão:

- `Adicionar credencial`.

---

## 19. Modal W14 — Criar credencial

### Objetivo

Cadastrar uma credencial em um site.

### Campos

#### Usuário

- obrigatório;
- texto livre;
- autocomplete desativado quando necessário;
- não transformar automaticamente.

#### Senha

- obrigatória;
- oculta por padrão;
- botão revelar;
- botão gerar senha, caso o gerador seja incluído nesta versão;
- botão copiar somente após preenchimento.

#### Observação

- opcional;
- textarea;
- contador de caracteres;
- tratar como sensível.

### Botões

- `Cancelar`;
- `Salvar credencial`.

### Regras

- não limpar o formulário após erro do servidor;
- não exibir senha em mensagens;
- possível duplicidade poderá gerar aviso.

---

## 20. Modal W15 — Editar credencial

### Objetivo

Alterar usuário, senha e observação.

### Campos

- `Usuário`;
- `Senha`;
- `Observação`.

### Botões

- `Cancelar`;
- `Salvar alterações`.

### Regras

- senha deve permanecer oculta;
- campos devem ser carregados apenas após autorização;
- alterações não podem ser registradas com valores sensíveis em logs.

---

## 21. Modal W16 — Excluir credencial

### Objetivo

Confirmar exclusão de uma credencial.

### Conteúdo

- site;
- usuário;
- aviso;
- botão `Cancelar`;
- botão `Excluir credencial`.

### Regras

- não exibir senha;
- ação destacada como perigo.

---

## 22. Modal W17 — Visualizar credencial

### Objetivo

Exibir uma credencial sem entrar em modo de edição.

### Campos exibidos

- site;
- usuário;
- senha mascarada;
- observação;
- última atualização;
- responsável pela última alteração, quando disponível.

### Botões

- `Copiar usuário`;
- `Revelar senha`;
- `Copiar senha`;
- `Editar`;
- `Fechar`.

### Comportamento

- senha oculta por padrão;
- revelação temporária;
- ao fechar, a senha deve voltar ao estado oculto;
- observação deve respeitar quebras de linha.

---

## 23. Tela W18 — Compartilhamento do cofre

### Objetivo

Gerenciar membros e convites.

### Permissão

Somente proprietário.

### Seções

#### Membros atuais

Cada linha deve exibir:

- nome;
- e-mail;
- papel;
- data de entrada;
- ações.

Ações:

- alterar permissão;
- remover membro.

#### Convites pendentes

Cada linha deve exibir:

- e-mail;
- permissão;
- data do convite;
- status;
- ações.

Ações:

- copiar link;
- cancelar convite;
- reenviar ou gerar novo link, se aplicável.

### Botões

- `Convidar usuário`;
- `Voltar ao cofre`.

---

## 24. Modal W19 — Convidar usuário

### Objetivo

Criar convite para acesso a um cofre.

### Campos

- `E-mail`;
- `Permissão`.

### Permissões disponíveis

- Editor.

O proprietário não poderá criar outro proprietário nesta versão.

### Botões

- `Cancelar`;
- `Criar convite`.

### Resultado

Exibir:

- confirmação;
- link de convite, quando aplicável;
- botão copiar link.

---

## 25. Modal W20 — Remover membro

### Objetivo

Confirmar a remoção de um membro.

### Conteúdo

- nome;
- e-mail;
- cofre;
- aviso de perda imediata de acesso;
- botão `Cancelar`;
- botão `Remover acesso`.

---

## 26. Modal W21 — Sair do cofre

### Objetivo

Permitir que um editor saia voluntariamente.

### Conteúdo

- nome do cofre;
- aviso;
- botão `Cancelar`;
- botão `Sair do cofre`.

### Regra

Não disponível para o proprietário.

---

## 27. Tela W22 — Convites

### Objetivo

Listar convites recebidos.

### Abas

- pendentes;
- anteriores.

### Card de convite

- nome do cofre;
- proprietário;
- permissão;
- data;
- status.

### Ações

Convite pendente:

- `Aceitar`;
- `Recusar`.

Histórico:

- somente consulta.

### Estado vazio

`Você não possui convites pendentes.`

---

## 28. Tela W23 — Importar CSV

### Objetivo

Importar cofres, sites e credenciais por CSV.

### Etapa 1 — Selecionar arquivo

Elementos:

- título: `Importar credenciais`;
- texto explicativo;
- área de upload;
- botão `Selecionar CSV`;
- link `Baixar arquivo modelo`;
- lista de colunas aceitas;
- limites do arquivo.

Botões:

- `Cancelar`;
- `Continuar`.

### Etapa 2 — Validar arquivo

Elementos:

- nome do arquivo;
- tamanho;
- quantidade de linhas;
- indicador de processamento;
- mensagens de erro estrutural.

### Etapa 3 — Pré-visualização

Tabela:

- número da linha;
- cofre;
- site;
- usuário;
- observação resumida;
- link;
- status;
- ação.

A senha deve aparecer apenas como mascarada.

Status possíveis:

- válido;
- erro;
- possível duplicidade;
- cofre inexistente;
- site existente;
- ignorado.

### Etapa 4 — Resolver cofres inexistentes

Para cada cofre inexistente:

- nome encontrado no CSV;
- opção `Criar novo cofre privado`;
- opção `Mapear para cofre existente`;
- opção `Ignorar linhas`.

### Etapa 5 — Resolver duplicidades

Para cada duplicidade:

- cofre;
- site;
- usuário;
- opção `Ignorar`;
- opção `Importar como novo`.

A interface nunca deve oferecer sobrescrita automática nesta versão.

### Etapa 6 — Confirmar

Resumo:

- linhas válidas;
- linhas ignoradas;
- linhas com erro;
- cofres a criar;
- sites a criar;
- sites existentes;
- credenciais a importar.

Botões:

- `Voltar`;
- `Confirmar importação`.

### Etapa 7 — Resultado

Exibir:

- quantidade importada;
- quantidade ignorada;
- quantidade com erro;
- cofres criados;
- sites criados;
- sites reutilizados.

Botões:

- `Ver cofres`;
- `Importar outro arquivo`;
- `Baixar relatório de erros`, se implementado.

### Estados

- arquivo inválido;
- cabeçalho ausente;
- codificação inválida;
- arquivo vazio;
- arquivo muito grande;
- linhas com erro;
- falha parcial;
- sucesso.

---

## 29. Tela W24 — Configurações da conta

### Objetivo

Permitir alterações básicas da conta.

### Abas

- Perfil;
- Segurança;
- Sessões.

### Aba Perfil

Campos:

- nome;
- e-mail somente leitura na primeira versão, salvo decisão diferente.

Botões:

- `Salvar alterações`.

### Aba Segurança

Seção alterar senha:

- senha atual;
- nova senha;
- confirmar nova senha;
- botão revelar;
- requisitos;
- botão `Alterar senha`.

### Aba Sessões

Lista de sessões:

- dispositivo;
- navegador;
- sistema operacional;
- IP aproximado;
- data de criação;
- último uso;
- sessão atual.

Ações:

- `Revogar`;
- `Encerrar outras sessões`;
- `Encerrar todas as sessões`.

---

## 30. Modal W25 — Revogar sessão

### Objetivo

Confirmar encerramento de uma sessão.

### Conteúdo

- dispositivo;
- último uso;
- IP;
- botão `Cancelar`;
- botão `Revogar sessão`.

---

## 31. Menu de perfil Web

### Itens

- nome;
- e-mail;
- `Configurações`;
- `Sair`.

### Comportamento

- abrir pela topbar;
- fechar ao clicar fora;
- acessível por teclado.

---

## 32. Estados globais Web

### Carregamento

Usar:

- skeleton para listas;
- spinner em botões;
- bloqueio apenas da área necessária.

### Erro geral

Exibir:

- mensagem clara;
- ação de tentar novamente;
- código de suporte opcional;
- nunca mostrar stack trace.

### Sem conexão

Exibir:

`Não foi possível conectar ao servidor.`

Ações:

- `Tentar novamente`.

### Sessão expirada

Exibir modal:

- título: `Sua sessão expirou`;
- texto;
- botão `Entrar novamente`.

### Sem permissão

Exibir:

- título: `Acesso não permitido`;
- texto;
- botão `Voltar aos cofres`.

### Recurso não encontrado

Exibir:

- título: `Conteúdo não encontrado`;
- botão `Voltar aos cofres`.

---

# PARTE II — APLICATIVO ANDROID

---

## 33. Estrutura geral do aplicativo

### Navegação principal

Barra inferior com:

- Cofres;
- Convites;
- Conta.

A importação CSV não deverá existir no aplicativo.

### Navegação interna

Fluxo principal:

```text
Cofres
→ Cofre
→ Site
→ Credencial
```

### App Bar

Deve exibir:

- título da tela;
- botão voltar;
- menu de ações;
- ação principal quando aplicável.

---

## 34. Tela M01 — Splash

### Objetivo

Exibir carregamento inicial.

### Elementos

- logo;
- nome do aplicativo;
- indicador discreto de carregamento.

### Fluxo

```text
Splash
→ Verificar sessão
→ Login ou Cofres
```

---

## 35. Tela M02 — Login

### Objetivo

Autenticar usuário.

### Elementos

- logo;
- campo e-mail;
- campo senha;
- botão revelar;
- botão `Entrar`;
- mensagem de erro;
- indicador de carregamento.

### Comportamento

- teclado adequado;
- suportar autofill do sistema para o próprio login;
- não salvar senha em armazenamento inseguro.

---

## 36. Tela M03 — Aceitar convite

### Objetivo

Abrir convite recebido por link.

### Elementos

- nome do cofre;
- proprietário;
- permissão;
- botão `Aceitar`;
- botão `Recusar`.

### Caso usuário não autenticado

- redirecionar ao login;
- retornar ao convite após autenticação.

---

## 37. Tela M04 — Lista de cofres

### Objetivo

Exibir cofres privados e compartilhados.

### Elementos

- título `Cofres`;
- botão flutuante `Novo cofre`;
- campo de busca;
- filtros simples;
- lista de cards;
- indicador de convites.

### Card

- nome;
- descrição curta;
- tipo;
- papel;
- quantidade de sites;
- última atualização.

### Ações

- tocar para abrir;
- menu:
  - editar;
  - compartilhar;
  - excluir;
  - sair, conforme papel.

---

## 38. Bottom sheet M05 — Criar cofre

### Campos

- nome;
- descrição.

### Botões

- `Cancelar`;
- `Criar`.

---

## 39. Tela M06 — Detalhes do cofre

### Elementos

- nome;
- descrição;
- indicador de compartilhamento;
- busca;
- lista de sites;
- botão flutuante `Novo site`;
- menu do cofre.

### Item de site

- nome;
- link resumido;
- quantidade de credenciais;
- última atualização.

### Menu do cofre

Proprietário:

- editar;
- compartilhar;
- excluir.

Editor:

- sair.

---

## 40. Bottom sheet M07 — Criar site

### Campos

- nome;
- link opcional.

### Botões

- `Cancelar`;
- `Criar`.

---

## 41. Tela M08 — Detalhes do site

### Elementos

- nome do site;
- link;
- botão `Abrir site`;
- lista de credenciais;
- botão flutuante `Nova credencial`;
- menu.

### Item de credencial

- usuário;
- senha mascarada;
- observação resumida;
- copiar usuário;
- copiar senha;
- abrir detalhes.

---

## 42. Tela M09 — Visualizar credencial

### Elementos

- site;
- usuário;
- senha mascarada;
- observação;
- última atualização.

### Botões

- `Copiar usuário`;
- `Revelar senha`;
- `Copiar senha`;
- `Editar`;
- menu `Excluir`.

### Comportamento

- senha oculta ao abrir;
- ocultar automaticamente ao sair;
- captura de tela poderá ser bloqueada conforme decisão de segurança.

---

## 43. Tela M10 — Criar credencial

### Campos

- usuário;
- senha;
- observação.

### Ações de senha

- revelar;
- ocultar;
- gerar senha, se incluído;
- copiar.

### Botões

- `Cancelar`;
- `Salvar`.

---

## 44. Tela M11 — Editar credencial

### Campos

- usuário;
- senha;
- observação.

### Botões

- `Cancelar`;
- `Salvar alterações`.

---

## 45. Diálogo M12 — Excluir credencial

### Conteúdo

- usuário;
- site;
- aviso;
- botão `Cancelar`;
- botão `Excluir`.

---

## 46. Tela M13 — Compartilhamento

### Objetivo

Gerenciar membros do cofre.

### Elementos

- membros atuais;
- convites pendentes;
- botão `Convidar`.

### Item de membro

- nome;
- e-mail;
- papel;
- menu de ações.

### Ações

- remover;
- alterar permissão, quando houver mais de uma opção futura.

---

## 47. Bottom sheet M14 — Convidar usuário

### Campos

- e-mail;
- permissão.

### Botões

- `Cancelar`;
- `Criar convite`.

### Resultado

- confirmação;
- botão `Copiar link`.

---

## 48. Tela M15 — Convites

### Elementos

- lista de convites;
- nome do cofre;
- proprietário;
- permissão;
- data.

### Botões

- `Aceitar`;
- `Recusar`.

### Estado vazio

`Nenhum convite pendente.`

---

## 49. Tela M16 — Conta

### Elementos

- nome;
- e-mail;
- seção Segurança;
- seção Sessões;
- versão do aplicativo;
- botão `Sair`.

### Ações

- editar nome;
- alterar senha;
- gerenciar sessões;
- sair.

---

## 50. Tela M17 — Alterar senha

### Campos

- senha atual;
- nova senha;
- confirmar nova senha.

### Botões

- `Cancelar`;
- `Alterar senha`.

---

## 51. Tela M18 — Sessões

### Elementos

Lista com:

- dispositivo;
- sistema;
- IP;
- último uso;
- marcador `Este dispositivo`.

### Ações

- revogar sessão;
- encerrar outras sessões;
- encerrar todas.

---

## 52. Estados globais Android

### Carregamento

- skeleton;
- indicador em botão;
- pull-to-refresh quando aplicável.

### Sem conexão

- mensagem;
- botão tentar novamente;
- manter dados sensíveis em memória somente conforme política definida.

### Sessão expirada

- diálogo;
- botão entrar novamente.

### Erro

- mensagem amigável;
- detalhes técnicos não exibidos.

### Sem permissão

- tela dedicada;
- botão voltar.

---

# PARTE III — COMPONENTES E COMPORTAMENTOS

---

## 53. Componente de senha

### Estados

- mascarada;
- revelada;
- copiada;
- erro.

### Elementos

- valor mascarado;
- botão revelar;
- botão copiar.

### Regras

- copiar sem mostrar;
- toast: `Senha copiada`;
- toast nunca deve incluir o valor;
- após tempo definido, tentar limpar a área de transferência quando tecnicamente possível;
- senha volta a ficar oculta após navegação.

---

## 54. Componente de usuário

### Elementos

- valor;
- botão copiar.

### Toast

`Usuário copiado`.

---

## 55. Componente de busca

### Placeholder

- Web: `Buscar por site ou usuário`;
- Android: `Buscar`.

### Comportamento

- debounce;
- botão limpar;
- sem pesquisa automática no conteúdo de observações;
- destacar correspondências sem expor senha.

---

## 56. Componente de cofre

### Informações

- nome;
- descrição;
- tipo;
- papel;
- quantidade de sites;
- atualização.

### Variações

- privado;
- compartilhado;
- proprietário;
- editor.

---

## 57. Componente de site

### Informações

- nome;
- link;
- quantidade de credenciais;
- atualização.

### Ações rápidas

- abrir;
- abrir link;
- editar;
- excluir.

---

## 58. Componente de credencial

### Informações

- usuário;
- senha mascarada;
- observação resumida;
- atualização.

### Ações rápidas

- copiar usuário;
- copiar senha;
- abrir;
- editar.

---

## 59. Toasts padronizados

### Sucesso

- `Cofre criado`;
- `Cofre atualizado`;
- `Site criado`;
- `Site atualizado`;
- `Credencial salva`;
- `Usuário copiado`;
- `Senha copiada`;
- `Convite criado`;
- `Sessão revogada`;
- `Importação concluída`.

### Erro

- `Não foi possível concluir a ação`;
- `Verifique os campos informados`;
- `Sua sessão expirou`;
- `Você não possui permissão para esta ação`;
- `Não foi possível conectar ao servidor`.

---

## 60. Confirmações obrigatórias

Exigir confirmação para:

- excluir cofre;
- excluir site;
- excluir credencial;
- remover membro;
- sair de cofre;
- revogar todas as sessões;
- confirmar importação CSV.

---

## 61. Permissões refletidas na interface

A interface não deve apenas esconder botões. O backend deve validar todas as permissões.

Na interface:

### Proprietário

Pode visualizar:

- editar cofre;
- excluir cofre;
- compartilhar;
- gerenciar membros.

### Editor

Não pode visualizar:

- excluir cofre;
- gerenciar membros;
- alterar permissões.

Pode visualizar:

- criar site;
- editar site;
- excluir site;
- criar credencial;
- editar credencial;
- excluir credencial;
- sair do cofre.

---

## 62. Responsividade Web

### Desktop

- sidebar fixa;
- tabelas ou listas amplas;
- modais centralizados;
- painel de detalhes opcional.

### Tablet

- sidebar recolhível;
- cards adaptados;
- ações agrupadas.

### Mobile Web

- drawer;
- cards em coluna;
- botões com área de toque adequada;
- modais em tela cheia quando necessário.

---

## 63. Acessibilidade

Requisitos:

- labels associadas aos campos;
- navegação por teclado;
- foco visível;
- contraste adequado;
- suporte a leitor de tela;
- textos alternativos;
- mensagens de erro vinculadas ao campo;
- não depender apenas de cor;
- área de toque adequada no Android;
- ícones com descrição acessível.

---

## 64. Segurança visual

A interface não deve:

- mostrar senha em listas;
- registrar senha em histórico visual;
- mostrar senha em toast;
- incluir credenciais em URL;
- manter senha revelada ao trocar de tela;
- mostrar dados de outro cofre por cache incorreto;
- exibir stack trace;
- preencher senha automaticamente em campo errado;
- manter credenciais no clipboard indefinidamente quando houver alternativa técnica.

---

## 65. Rotas sugeridas Web

```text
/setup
/login
/invite/:token
/app/vaults
/app/vaults/:vaultId
/app/vaults/:vaultId/sites/:siteId
/app/invitations
/app/import
/app/settings/profile
/app/settings/security
/app/settings/sessions
```

Modais podem utilizar rotas ou estado local conforme decisão arquitetural.

---

## 66. Navegação sugerida Android

```text
Splash
Login
VaultList
VaultDetails
SiteDetails
CredentialDetails
CredentialForm
Invitations
VaultMembers
Account
ChangePassword
Sessions
```

---

## 67. Textos vazios principais

### Cofres

`Você ainda não possui cofres.`

### Sites

`Este cofre ainda não possui sites.`

### Credenciais

`Nenhuma credencial cadastrada para este site.`

### Convites

`Você não possui convites pendentes.`

### Busca

`Nenhum resultado encontrado.`

### Sessões

`Nenhuma outra sessão ativa.`

---

## 68. Estados de erro principais

### 401

`Sua sessão expirou. Entre novamente.`

### 403

`Você não possui permissão para esta ação.`

### 404

`O conteúdo solicitado não foi encontrado.`

### 409

`Já existe um registro semelhante.`

### 422

`Verifique os campos informados.`

### 429

`Muitas tentativas. Aguarde antes de tentar novamente.`

### 500

`Ocorreu um erro inesperado.`

---

## 69. Critérios de aceite das telas

Uma tela somente será considerada concluída quando possuir:

- layout desktop quando aplicável;
- layout mobile quando aplicável;
- estados de carregamento;
- estado vazio;
- estado de erro;
- validação de campos;
- comportamento de permissões;
- acessibilidade básica;
- testes de componente;
- documentação atualizada;
- integração com a API;
- validação no ambiente de testes.

---

## 70. Ordem sugerida de prototipação

### Fase 1

- W02 Login;
- W05 Dashboard;
- W09 Detalhes do cofre;
- W13 Detalhes do site;
- W14 Criar credencial;
- W17 Visualizar credencial.

### Fase 2

- criação e edição de cofres;
- criação e edição de sites;
- compartilhamento;
- convites;
- configurações;
- sessões.

### Fase 3

- importação CSV;
- estados avançados;
- responsividade completa.

### Fase 4 Android

- M01 Splash;
- M02 Login;
- M04 Cofres;
- M06 Cofre;
- M08 Site;
- M09 Credencial;
- M10 Criar credencial;
- M16 Conta.

---

## 71. Prompt-base para o Stitch — Web

```text
Crie uma aplicação Web responsiva para um cofre de senhas multiusuário e self-hosted.

Estilo visual:
- moderno;
- minimalista;
- profissional;
- alto contraste;
- aparência segura;
- sem excesso de cores;
- sidebar fixa no desktop;
- drawer no mobile;
- suporte a tema claro e escuro;
- componentes consistentes.

Estrutura principal:
- sidebar com Cofres, Convites, Importar CSV e Configurações;
- topbar com busca e menu do usuário;
- conteúdo principal em cards e listas.

Domínio:
Usuário → Cofre → Site → Credencial.

Cofres podem ser privados ou compartilhados.
Papéis: Proprietário e Editor.

Cada site possui:
- nome obrigatório;
- link opcional;
- várias credenciais.

Cada credencial possui:
- usuário;
- senha;
- observação opcional.

A senha deve ficar mascarada por padrão e possuir botões para revelar e copiar.

Criar as seguintes telas:
- configuração inicial;
- login;
- dashboard de cofres;
- detalhes do cofre;
- criar e editar cofre;
- detalhes do site;
- criar e editar site;
- visualizar credencial;
- criar e editar credencial;
- gerenciamento de membros;
- convites;
- importação CSV em etapas;
- perfil;
- alteração de senha;
- sessões.

Para cada tela, criar:
- estado normal;
- carregamento;
- erro;
- estado vazio;
- responsividade;
- diálogos de confirmação;
- acessibilidade básica.

A importação CSV deve possuir:
seleção → validação → pré-visualização → resolução de erros → confirmação → resultado.

Não exibir senhas em listas, toasts ou mensagens de erro.
```

---

## 72. Prompt-base para o Stitch — Android

```text
Crie um aplicativo Android para um cofre de senhas multiusuário e self-hosted.

Estilo:
- Material Design moderno;
- minimalista;
- profissional;
- alto contraste;
- foco em segurança;
- suporte a tema claro e escuro.

Navegação inferior:
- Cofres;
- Convites;
- Conta.

Fluxo principal:
Cofres → Cofre → Site → Credencial.

Cada cofre pode ser privado ou compartilhado.
Papéis: Proprietário e Editor.

Cada site possui:
- nome;
- link opcional;
- várias credenciais.

Cada credencial possui:
- usuário;
- senha;
- observação opcional.

A senha deve ficar mascarada por padrão e possuir ações para revelar e copiar.

Criar telas:
- splash;
- login;
- lista de cofres;
- detalhes do cofre;
- criar e editar cofre;
- detalhes do site;
- criar e editar site;
- visualizar credencial;
- criar e editar credencial;
- compartilhamento;
- convites;
- conta;
- alteração de senha;
- sessões.

Utilizar:
- app bar;
- cards;
- bottom sheets;
- diálogos;
- floating action button;
- estados de loading, erro e vazio.

Não criar tela de importação CSV no Android.
Não criar preenchimento automático nesta fase.
Não exibir senhas em listas, notificações, logs ou mensagens.
```

---

## 73. Observações finais

Este documento descreve a primeira versão das interfaces.

Qualquer nova tela deverá:

- respeitar o escopo;
- seguir o mesmo design system;
- documentar campos;
- documentar botões;
- documentar estados;
- documentar permissões;
- prever Web e Android quando aplicável;
- atualizar os fluxos de navegação;
- possuir testes.

Extensão de navegador, autofill Android, favoritos, tags, lixeira, histórico completo e exportação permanecem fora do escopo inicial.
