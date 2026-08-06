import { ApiException } from '@/common/errors/api.exception';

import { HealthController } from './health.controller';
import { type HealthService } from './health.service';

function buildController(isDatabaseReachable: boolean): HealthController {
  const healthService: Pick<HealthService, 'isDatabaseReachable'> = {
    isDatabaseReachable: () => Promise.resolve(isDatabaseReachable),
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
    it('reports ready when the database answers', async () => {
      await expect(buildController(true).getReadiness()).resolves.toEqual({
        data: { status: 'ready', database: 'ok' },
      });
    });

    it('fails closed with SERVICE_UNAVAILABLE when the database does not answer', async () => {
      await expect(buildController(false).getReadiness()).rejects.toBeInstanceOf(ApiException);
    });

    it('does not describe why the database is unreachable', async () => {
      await expect(buildController(false).getReadiness()).rejects.toMatchObject({
        code: 'SERVICE_UNAVAILABLE',
        publicMessage: 'O serviço ainda não está disponível.',
      });
    });
  });
});
