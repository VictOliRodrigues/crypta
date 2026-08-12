import { Module } from '@nestjs/common';

import { AuditService } from './audit.service';

/**
 * Auditoria compartilhada.
 *
 * Módulo próprio desde a R0.3 porque sites, credenciais e convites vão gravar
 * na mesma tabela. Deixá-la dentro de `vaults` faria o segundo módulo importar
 * o primeiro por um motivo que não tem nada a ver com cofre.
 */
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
