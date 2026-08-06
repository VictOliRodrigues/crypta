// A ordem importa: o polyfill de metadata precisa ser avaliado antes de
// qualquer módulo que use decorators. Por isso este import fica fora do bloco
// ordenado automaticamente.
// eslint-disable-next-line simple-import-sort/imports
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { API_PREFIX, RESPONSE_HEADERS } from '@vault/contracts';

import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { StructuredLogger } from '@/common/logging/structured-logger';
import { AppConfigService } from '@/config/app-config.service';
import { loadLocalEnv } from '@/config/load-local-env';

import { AppModule } from './app.module';

/**
 * Limite de corpo (ARCHITECTURE.md secao 35).
 *
 * Sem limite explícito, um corpo grande é caminho fácil de exaustão de memória.
 * O valor precisará ser revisto junto com os limites de importação em lote
 * (PEND-010).
 */
const BODY_LIMIT = '1mb';

async function bootstrap(): Promise<void> {
  // Precisa acontecer antes de qualquer leitura de process.env.
  loadLocalEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const appConfig = app.get(AppConfigService);

  const logger = new StructuredLogger(appConfig.logLevel);
  app.useLogger(logger);

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

  app.enableShutdownHooks();

  // Swagger fica fora de produção: mesmo sem segredos, ele descreve toda a
  // superfície da API e facilita reconhecimento (docs/API.md secao 42).
  if (!appConfig.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Cofre de Senhas — API')
        .setDescription(
          'API do cofre de senhas. Conteúdo sensível trafega criptografado pelo cliente.',
        )
        .setVersion(version)
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
  }

  await app.listen(appConfig.port);

  logger.event('info', 'api_started', { action: 'API_STARTED' });
}

void bootstrap();
