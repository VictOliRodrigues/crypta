import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigService } from '@/config/app-config.service';

import { AuthController } from './controllers/auth.controller';
import { SetupController } from './controllers/setup.controller';
import { AuthRepository } from './repositories/auth.repository';
import { SessionRepository } from './repositories/session.repository';
import { AccessTokenService } from './services/access-token.service';
import { CreateFirstUserService } from './services/create-first-user.service';
import { GetKdfParametersService } from './services/get-kdf-parameters.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { ServerSecretService } from './services/server-secret.service';
import { SessionIssuerService } from './services/session-issuer.service';
import { SetupStatusService } from './services/setup-status.service';

/**
 * Módulo de autenticação.
 *
 * O throttle por IP é a camada grosseira anterior ao bloqueio por conta, que
 * vive no banco. Em memória do processo, por decisão do ADR 0022: o controle
 * autoritativo é o da conta, e com mais de uma réplica o teto efetivo por IP
 * passa a ser o limite vezes o número de réplicas — limitação aceita e
 * registrada, não descuido.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        throttlers: [{ name: 'auth', ttl: 60_000, limit: appConfig.authIpRateLimit }],
      }),
    }),
  ],
  controllers: [SetupController, AuthController],
  providers: [
    AuthRepository,
    SessionRepository,
    ServerSecretService,
    AccessTokenService,
    RefreshTokenService,
    SessionIssuerService,
    SetupStatusService,
    CreateFirstUserService,
    GetKdfParametersService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [AccessTokenService, ServerSecretService, SessionRepository, AuthRepository],
})
export class AuthModule {}
