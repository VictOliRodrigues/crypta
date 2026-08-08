import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Verificações de readiness (docs/API.md secao 17).
 *
 * Duas, e as duas falham fechado. A conexão prova que o MySQL responde; o
 * estado das migrations prova que ele responde com o schema certo. Um banco
 * alcançável com schema desatualizado é pior do que um banco fora do ar,
 * porque a instância aceitaria tráfego e falharia por dentro.
 */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseReachable(): Promise<boolean> {
    return this.prisma.isReachable();
  }

  async areMigrationsApplied(): Promise<boolean> {
    return this.prisma.areMigrationsApplied();
  }
}
