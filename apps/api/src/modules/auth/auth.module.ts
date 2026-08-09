import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigService } from '@/config/app-config.service';

import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { SetupController } from './controllers/setup.controller';
import { UserController } from './controllers/user.controller';
import { AccessTokenGuard } from './guards/access-token.guard';
import { AuthRepository } from './repositories/auth.repository';
import { SessionRepository } from './repositories/session.repository';
import { AccessTokenService } from './services/access-token.service';
import { ChangePasswordService } from './services/change-password.service';
import { CreateFirstUserService } from './services/create-first-user.service';
import { GetKdfParametersService } from './services/get-kdf-parameters.service';
import { GetKeyBundleService } from './services/get-key-bundle.service';
import { ListSessionsService } from './services/list-sessions.service';
import { LoginService } from './services/login.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RotateSessionService } from './services/rotate-session.service';
import { ServerSecretService } from './services/server-secret.service';
import { SessionIssuerService } from './services/session-issuer.service';
import { SetupStatusService } from './services/setup-status.service';

/**
 * Módulo de autenticação.
 *
 * O `AccessTokenGuard` é **global**: toda rota nasce protegida, e abrir uma
 * exige `@PublicRoute()` explícito. O inverso — proteger caso a caso — falha em
 * silêncio quando alguém esquece o decorator, e o sintoma é uma rota aberta que
 * ninguém nota.
 *
 * A ordem dos guards importa. O throttle vem primeiro, para que uma enxurrada de
 * requisições sem token seja barrada antes de qualquer consulta ao banco.
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
  controllers: [SetupController, AuthController, SessionController, UserController],
  providers: [
    AuthRepository,
    SessionRepository,
    ServerSecretService,
    AccessTokenService,
    RefreshTokenService,
    SessionIssuerService,
    RotateSessionService,
    SetupStatusService,
    CreateFirstUserService,
    ChangePasswordService,
    GetKdfParametersService,
    GetKeyBundleService,
    LoginService,
    ListSessionsService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
  exports: [AccessTokenService, ServerSecretService, SessionRepository, AuthRepository],
})
export class AuthModule {}
