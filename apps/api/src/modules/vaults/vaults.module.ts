import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { VaultController } from './controllers/vault.controller';
import { VaultAccessPolicy } from './policies/vault-access.policy';
import { VaultRepository } from './repositories/vault.repository';
import { CreateVaultService } from './services/create-vault.service';
import { DeleteVaultService } from './services/delete-vault.service';
import { ListVaultsService } from './services/list-vaults.service';
import { UpdateVaultService } from './services/update-vault.service';
import { VaultSnapshotService } from './services/vault-snapshot.service';

/**
 * Módulo de cofres (`BLG-1001` a `BLG-1005`).
 *
 * As rotas nascem protegidas: o `AccessTokenGuard` do módulo de autenticação é
 * global, e nenhuma rota daqui usa `@PublicRoute()`.
 *
 * Um service por caso de uso, e não um `VaultService` único (`CLAUDE.md`
 * secao 30). Criar, editar e excluir têm regras de autorização e de transação
 * diferentes, e mantê-las em arquivos separados é o que impede a de uma vazar
 * para a outra.
 */
@Module({
  imports: [AuditModule],
  controllers: [VaultController],
  providers: [
    VaultRepository,
    VaultAccessPolicy,
    CreateVaultService,
    ListVaultsService,
    UpdateVaultService,
    DeleteVaultService,
    VaultSnapshotService,
  ],
})
export class VaultsModule {}
