import { Injectable } from '@nestjs/common';

import { type ApiListMeta, type VaultDetail, type VaultSummary } from '@crypta/contracts';

import { type ListVaultsQuery } from '../dto/vault.schema';
import { toVaultDetail, toVaultSummary } from '../mappers/vault.mapper';
import { VaultAccessPolicy } from '../policies/vault-access.policy';
import { VaultRepository } from '../repositories/vault.repository';

/**
 * Leitura de cofres (docs/API.md secoes 33 e 35, `BLG-1002` e `BLG-1003`).
 *
 * A API devolve metadata cifrada e contagens. Ela sabe **quantos** sites um
 * cofre tem e não sabe o nome de nenhum — inclusive o do próprio cofre.
 */
@Injectable()
export class ListVaultsService {
  constructor(
    private readonly repository: VaultRepository,
    private readonly policy: VaultAccessPolicy,
  ) {}

  async list(
    userId: string,
    query: ListVaultsQuery,
  ): Promise<{ data: VaultSummary[]; meta: ApiListMeta }> {
    const page = await this.repository.listForUser({
      userId,
      limit: query.limit,
      cursor: query.cursor,
      role: query.role,
    });

    // O repositório pediu uma linha a mais do que o limite. Se ela veio, existe
    // próxima página — e a linha extra é descartada, não devolvida.
    const hasMore = page.length > query.limit;
    const visible = hasMore ? page.slice(0, query.limit) : page;

    const filtered = visible.filter((vault) => {
      if (query.type === 'private') {
        return vault.memberCount === 1;
      }

      if (query.type === 'shared') {
        return vault.memberCount > 1;
      }

      return true;
    });

    return {
      data: filtered.map(toVaultSummary),
      meta: {
        // O cursor sai da última linha **visível**, e não da filtrada: filtrar
        // é decisão de apresentação, e um cursor que pulasse o que o filtro
        // escondeu faria a próxima página começar no lugar errado.
        cursor: hasMore ? (visible.at(-1)?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async findOne(vaultId: string, userId: string): Promise<VaultDetail> {
    return toVaultDetail(await this.policy.requireMember(vaultId, userId));
  }
}
