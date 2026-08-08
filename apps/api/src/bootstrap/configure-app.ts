import { ValidationPipe } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { API_PREFIX, RESPONSE_HEADERS } from '@crypta/contracts';

import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { type StructuredLogger } from '@/common/logging/structured-logger';
import { type AppConfigService } from '@/config/app-config.service';

/**
 * Configuração de request da aplicação, aplicada igualmente em produção e nos
 * testes end-to-end.
 *
 * Existe separada de `main.ts` para que o harness de e2e não monte uma segunda
 * versão da aplicação. Um teste que roda sem o `ValidationPipe` com
 * `forbidNonWhitelisted`, ou sem o filtro global de erros, aprova um
 * comportamento que produção não tem — e é justamente o campo indevido
 * silenciosamente aceito que a `CLAUDE.md` secao 33 manda rejeitar.
 *
 * Fora daqui ficam apenas `listen`, o Swagger e o carregamento do `.env`, que
 * não afetam o tratamento de uma requisição.
 */

/**
 * Limite de corpo (ARCHITECTURE.md secao 35).
 *
 * Sem limite explícito, um corpo grande é caminho fácil de exaustão de memória.
 * O valor precisará ser revisto junto com os limites de importação em lote
 * (PEND-010).
 */
const BODY_LIMIT = '1mb';

export function configureApp(
  app: NestExpressApplication,
  appConfig: AppConfigService,
  logger: StructuredLogger,
): void {
  app.setGlobalPrefix(API_PREFIX);

  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: BODY_LIMIT, extended: true });

  app.use(
    helmet({ contentSecurityPolicy: true, crossOriginResourcePolicy: { policy: 'same-site' } }),
  );

  // CORS restrito à lista do ambiente. `credentials` é necessário para o
  // cookie de refresh; por isso a origem nunca pode ser curinga.
  app.enableCors({
    origin: [...appConfig.corsOrigins],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'Idempotency-Key',
      'X-Client-Type',
      'X-Client-Version',
    ],
    exposedHeaders: [RESPONSE_HEADERS.requestId],
    maxAge: 600,
  });

  const { version, commit } = appConfig.buildInfo;

  // Headers informativos de deployment (docs/API.md secao 6). Não substituem
  // GET /version e não contêm nada além do que já é público lá.
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader(RESPONSE_HEADERS.appVersion, version);
    response.setHeader(RESPONSE_HEADERS.appCommit, commit);
    response.setHeader(RESPONSE_HEADERS.appEnvironment, appConfig.environment);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));
}
