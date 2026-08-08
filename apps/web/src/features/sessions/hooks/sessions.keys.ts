/**
 * Query keys da feature de sessões.
 *
 * Centralizadas por feature, como o `CLAUDE.md` secao 21 exige. Chaves montadas
 * inline no ponto de uso divergem, e invalidar uma delas deixa de invalidar a
 * outra sem que nada quebre visivelmente.
 */
export const sessionsKeys = {
  all: ['sessions'] as const,
  list: () => [...sessionsKeys.all, 'list'] as const,
} as const;
