/**
 * Query keys da feature de autenticação.
 *
 * Centralizadas por feature, como o `CLAUDE.md` secao 21 exige. Chaves montadas
 * inline no ponto de uso divergem, e invalidar uma delas deixa de invalidar a
 * outra sem que nada quebre visivelmente.
 */
export const authKeys = {
  all: ['auth'] as const,
  setupStatus: () => [...authKeys.all, 'setup-status'] as const,
  keyBundle: () => [...authKeys.all, 'key-bundle'] as const,
} as const;
