import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Verificações de readiness (docs/API.md secao 17).
 *
 * Hoje cobre apenas a conexão com o MySQL. A verificação do estado das
 * migrations entra junto com a primeira migration, na R0.2: enquanto o schema
 * não tem tabelas, não existe `_prisma_migrations` para consultar.
 */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseReachable(): Promise<boolean> {
    return this.prisma.isReachable();
  }
}
