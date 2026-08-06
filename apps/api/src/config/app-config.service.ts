import { Injectable } from '@nestjs/common';

import { type AppEnvironment } from '@vault/contracts';

import { type AppEnv, type LogLevel } from './env.schema';

/**
 * Acesso tipado à configuração validada.
 *
 * Nenhum outro ponto da aplicação lê `process.env` diretamente: assim existe um
 * único lugar onde a configuração é validada e um único lugar para auditar o
 * que é exposto.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly env: AppEnv) {}

  get environment(): AppEnvironment {
    return this.env.APP_ENVIRONMENT;
  }

  get isProduction(): boolean {
    return this.env.APP_ENVIRONMENT === 'production';
  }

  get port(): number {
    return this.env.API_PORT;
  }

  get corsOrigins(): readonly string[] {
    return this.env.CORS_ORIGINS;
  }

  get logLevel(): LogLevel {
    return this.env.LOG_LEVEL;
  }

  /** Metadados do artefato implantado, expostos por `GET /version`. */
  get buildInfo(): { version: string; commit: string; builtAt: string } {
    return {
      version: this.env.APP_VERSION,
      commit: this.env.APP_COMMIT,
      builtAt: this.env.APP_BUILT_AT,
    };
  }
}
