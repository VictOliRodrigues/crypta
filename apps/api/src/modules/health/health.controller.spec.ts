import { ApiException } from '@/common/errors/api.exception';

import { HealthController } from './health.controller';
import { type HealthService } from './health.service';

function buildController(
  isDatabaseReachable: boolean,
  areMigrationsApplied = true,
): HealthController {
  const healthService: Pick<HealthService, 'isDatabaseReachable' | 'areMigrationsApplied'> = {
    isDatabaseReachable: () => Promise.resolve(isDatabaseReachable),
    areMigrationsApplied: () => Promise.resolve(areMigrationsApplied),
  };

  return new HealthController(healthService as HealthService);
}

describe('HealthController', () => {
  describe('getLiveness', () => {
    it('reports the process as alive without touching the database', () => {
      const response = buildController(false).getLiveness();

      expect(response.data.status).toBe('ok');
      expect(response.data.service).toBe('crypta-api');
    });

    it('returns an ISO 8601 timestamp', () => {
      const { timestamp } = buildController(true).getLiveness().data;

      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('does not expose hostname, database or dependency versions', () => {
      const response = buildController(true).getLiveness();

      expect(Object.keys(response.data).sort()).toEqual(['service', 'status', 'timestamp']);
    });
  });

  describe('getReadiness', () => {
    it('reports ready when the database answers and the migrations are applied', async () => {
      await expect(buildController(true).getReadiness()).resolves.toEqual({
        data: { status: 'ready', database: 'ok' },
      });
    });

    it('fails closed with SERVICE_UNAVAILABLE when the database does not answer', async () => {
      await expect(buildController(false).getReadiness()).rejects.toBeInstanceOf(ApiException);
    });

    /**
     * Banco alcançável com schema errado é pior do que banco fora do ar: a
     * instância aceitaria tráfego e falharia por dentro (docs/API.md secao 17).
     */
    it('fails closed when the database answers but the migrations did not run', async () => {
      await expect(buildController(true, false).getReadiness()).rejects.toMatchObject({
        code: 'SERVICE_UNAVAILABLE',
      });
    });

    it('does not describe why the database is unreachable', async () => {
      await expect(buildController(false).getReadiness()).rejects.toMatchObject({
        code: 'SERVICE_UNAVAILABLE',
        publicMessage: 'O serviço ainda não está disponível.',
      });
    });

    it('does not reveal whether the failure was the connection or the migrations', async () => {
      const unreachable = await buildController(false)
        .getReadiness()
        .catch((error: unknown) => error);
      const pending = await buildController(true, false)
        .getReadiness()
        .catch((error: unknown) => error);

      expect(unreachable).toMatchObject({ publicMessage: 'O serviço ainda não está disponível.' });
      expect(pending).toMatchObject({ publicMessage: 'O serviço ainda não está disponível.' });
    });
  });
});
