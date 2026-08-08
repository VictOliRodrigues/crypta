import { Injectable } from '@nestjs/common';

import { type AppEnvironment } from '@crypta/contracts';

import { type VersionedSecret } from './auth-env.schema';
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

  /** Segredo do servidor corrente, com a versão que o identifica (ADR 0022). */
  get authServerSecret(): VersionedSecret {
    return this.env.AUTH_SERVER_SECRET;
  }

  /** Versão anterior do segredo, presente apenas durante uma rotação. */
  get previousAuthServerSecret(): VersionedSecret | null {
    return this.env.AUTH_SERVER_SECRET_PREVIOUS ?? null;
  }

  /** Par Ed25519 do access token, já em PEM. */
  get jwtKeys(): { privateKeyPem: string; publicKeyPem: string } {
    return {
      privateKeyPem: this.env.JWT_PRIVATE_KEY,
      publicKeyPem: this.env.JWT_PUBLIC_KEY,
    };
  }

  /** Prazos de sessão em segundos (ADR 0021). */
  get tokenTtl(): { access: number; refreshIdle: number; refreshAbsolute: number } {
    return {
      access: this.env.ACCESS_TOKEN_TTL,
      refreshIdle: this.env.REFRESH_TOKEN_TTL,
      refreshAbsolute: this.env.REFRESH_TOKEN_ABSOLUTE_TTL,
    };
  }

  get refreshCookieSameSite(): 'Strict' | 'Lax' | 'None' {
    return this.env.REFRESH_COOKIE_SAMESITE;
  }

  /** Política de bloqueio progressivo (ADR 0022). */
  get loginLockPolicy(): { maxAttempts: number; initialSeconds: number; maxSeconds: number } {
    return {
      maxAttempts: this.env.LOGIN_MAX_ATTEMPTS,
      initialSeconds: this.env.LOGIN_LOCK_INITIAL_SECONDS,
      maxSeconds: this.env.LOGIN_LOCK_MAX_SECONDS,
    };
  }

  get authIpRateLimit(): number {
    return this.env.AUTH_IP_RATE_LIMIT;
  }
}
