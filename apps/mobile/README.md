# apps/mobile

Aplicativo Android (React Native + Expo), distribuído por APK assinado.

## Estado atual

**Não iniciado.** Entra na **R0.7** do roadmap, depois de a API, a criptografia e o compartilhamento estarem estáveis.

O scaffold ainda não foi criado de propósito: adicionar a árvore de dependências do Expo agora aumentaria a superfície de auditoria e o tempo de CI sem entregar nada testável, e o app depende de `@vault/crypto-mobile`, que está bloqueado por PEND-003.

## Escopo previsto para a R0.7

Ver [`docs/ROADMAP.md`](../../docs/ROADMAP.md) secoes 37 a 40:

- login, cofres, sites, credenciais, convites, sessões e conta;
- cópia de usuário e senha, revelar senha;
- refresh token no Android Keystore;
- build release e APK assinado.

Fora do escopo da R0.7: importação CSV, Android Autofill, biometria, modo offline e iOS.

## Antes de iniciar

- fechar PEND-003 (biblioteca libsodium para React Native);
- fechar PEND-004 (parâmetros Argon2id, medidos também no Android mais fraco suportado);
- fechar PEND-013 (bloqueio de screenshot);
- confirmar que `@vault/contracts` e `@vault/crypto-core` cobrem o que o app precisa.
