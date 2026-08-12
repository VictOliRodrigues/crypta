import { Injectable } from '@nestjs/common';

import { VaultAccessDeniedException, VaultOwnerRequiredException } from '../errors/vault.errors';
import { VaultRepository, type VaultWithRole } from '../repositories/vault.repository';

/**
 * Autorização de cofre, em um lugar só (`CLAUDE.md` secao 32).
 *
 * Nenhum service consulta membership por conta própria. Centralizar não é
 * organização: é o que faz uma rota nova nascer autorizada, porque a única
 * maneira de obter o cofre já exige dizer qual acesso se está pedindo.
 *
 * **A ausência de acesso é sempre `404`.** Distinguir "não existe" de "não é
 * seu" transformaria a rota em oráculo de existência — e a existência de um
 * cofre é informação, mesmo sem o conteúdo.
 */
@Injectable()
export class VaultAccessPolicy {
  constructor(private readonly repository: VaultRepository) {}

  /** Exige membership. Serve leitura e o que EDITOR pode fazer. */
  async requireMember(vaultId: string, userId: string): Promise<VaultWithRole> {
    const vault = await this.repository.findForUser(vaultId, userId);

    if (vault === null) {
      throw new VaultAccessDeniedException();
    }

    return vault;
  }

  /**
   * Exige ser dono.
   *
   * A ordem importa: primeiro membership, com `404` para quem não tem acesso
   * nenhum; só depois o papel, com `403` para o membro que não é dono. Verificar
   * o papel antes devolveria `403` a um estranho, dizendo que o cofre existe.
   */
  async requireOwner(vaultId: string, userId: string): Promise<VaultWithRole> {
    const vault = await this.requireMember(vaultId, userId);

    if (vault.role !== 'OWNER') {
      throw new VaultOwnerRequiredException();
    }

    return vault;
  }
}
