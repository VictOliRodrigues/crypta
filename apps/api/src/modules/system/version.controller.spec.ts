import { AppConfigService } from '@/config/app-config.service';
import { parseEnv } from '@/config/env.schema';
import { VALID_ENV } from '@/config/test-env.fixture';

import { VersionController } from './version.controller';

function buildController(overrides: Record<string, string> = {}): VersionController {
  const env = parseEnv({
    ...VALID_ENV,
    APP_ENVIRONMENT: 'staging',
    DATABASE_URL: 'mysql://crypta:s3cr3t@db:3306/crypta_staging',
    CORS_ORIGINS: 'https://crypta-staging.example.com',
    APP_VERSION: '0.4.0-rc.2',
    APP_COMMIT: 'b85c091',
    APP_BUILT_AT: '2026-07-31T18:00:00.000Z',
    ...overrides,
  });

  return new VersionController(new AppConfigService(env));
}

describe('VersionController', () => {
  it('returns the deployed build metadata', () => {
    expect(buildController().getVersion()).toEqual({
      data: {
        service: 'crypta-api',
        version: '0.4.0-rc.2',
        commit: 'b85c091',
        environment: 'staging',
        builtAt: '2026-07-31T18:00:00.000Z',
      },
    });
  });

  it('reports the environment it was configured with, not a hardcoded value', () => {
    const { environment } = buildController({ APP_ENVIRONMENT: 'production' }).getVersion().data;

    expect(environment).toBe('production');
  });

  it('exposes only the documented fields', () => {
    expect(Object.keys(buildController().getVersion().data).sort()).toEqual([
      'builtAt',
      'commit',
      'environment',
      'service',
      'version',
    ]);
  });
});
