// A ordem importa: o polyfill de metadata precisa ser avaliado antes de
// qualquer módulo que use decorators. Por isso este import fica fora do bloco
// ordenado automaticamente.
// eslint-disable-next-line simple-import-sort/imports
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { API_PREFIX } from '@crypta/contracts';

import { configureApp } from '@/bootstrap/configure-app';
import { StructuredLogger } from '@/common/logging/structured-logger';
import { AppConfigService } from '@/config/app-config.service';
import { loadLocalEnv } from '@/config/load-local-env';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Precisa acontecer antes de qualquer leitura de process.env.
  loadLocalEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const appConfig = app.get(AppConfigService);

  const logger = new StructuredLogger(appConfig.logLevel);
  app.useLogger(logger);

  // Mesma configuração que o harness de e2e aplica, para que o teste exercite a
  // aplicação real e não uma segunda montagem parecida.
  configureApp(app, appConfig, logger);

  app.enableShutdownHooks();

  // Swagger fica fora de produção: mesmo sem segredos, ele descreve toda a
  // superfície da API e facilita reconhecimento (docs/API.md secao 42).
  if (!appConfig.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Crypta — API')
        .setDescription(
          'API do cofre de senhas. Conteúdo sensível trafega criptografado pelo cliente.',
        )
        .setVersion(appConfig.buildInfo.version)
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
  }

  await app.listen(appConfig.port);

  logger.event('info', 'api_started', { action: 'API_STARTED' });
}

void bootstrap();
