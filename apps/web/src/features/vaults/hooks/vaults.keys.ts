/**
 * Query keys da feature de cofres.
 *
 * Centralizadas por feature (`CLAUDE.md` secao 21). Chaves montadas inline no
 * ponto de uso divergem, e invalidar uma delas deixa de invalidar a outra sem
 * que nada quebre visivelmente.
 */
export const vaultsKeys = {
  all: ['vaults'] as const,
  list: () => [...vaultsKeys.all, 'list'] as const,
  detail: (vaultId: string) => [...vaultsKeys.all, 'detail', vaultId] as const,
} as const;
