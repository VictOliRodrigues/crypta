/* eslint-disable no-restricted-imports -- Este é o único ponto autorizado a
   instanciar o PrismaClient. Os demais módulos recebem PrismaService por
   injeção (CLAUDE.md secao 31). */
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  /**
   * A conexão é preguiçosa de propósito.
   *
   * Chamar `$connect()` no `onModuleInit` faria a aplicação inteira falhar no
   * boot quando o MySQL estivesse indisponível — no Coolify isso vira crash
   * loop, e `/health/live` e `/version` deixariam de responder justamente
   * quando são mais necessários para diagnóstico.
   *
   * Com conexão preguiçosa, a instância sobe, `/health/ready` responde `503` e
   * o orquestrador para de mandar tráfego sem derrubar o container. O Prisma
   * conecta na primeira query.
   */

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Verifica se o banco responde, para o readiness probe.
   *
   * Usa SQL direto porque não existe entidade para consultar: a checagem
   * precisa ser independente do schema e não pode criar acoplamento com
   * nenhuma tabela específica. A template tag do Prisma parametriza a query,
   * então não há concatenação de entrada (STYLE_GUIDE.md secao 30).
   *
   * Retorna booleano em vez de propagar o erro: a causa da indisponibilidade
   * não pode chegar ao corpo da resposta.
   */
  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
