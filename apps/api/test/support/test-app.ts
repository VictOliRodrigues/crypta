// A ordem importa: o polyfill de metadata precisa ser avaliado antes de
// qualquer módulo que use decorators — o `AppModule` abaixo é um deles. Por
// isso este import fica fora do bloco ordenado automaticamente, como em
// `src/main.ts`.
// eslint-disable-next-line simple-import-sort/imports
import 'reflect-metadata';

import { type Server } from 'node:http';

import { type INestApplication } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { configureApp } from '@/bootstrap/configure-app';
import { StructuredLogger } from '@/common/logging/structured-logger';
import { AppConfigService } from '@/config/app-config.service';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Aplicação de teste, montada com a MESMA configuração de produção.
 *
 * `configureApp` é a função que `main.ts` chama. Repetir a configuração aqui
 * produziria testes que aprovam comportamento que produção não tem — sem
 * `forbidNonWhitelisted`, por exemplo, um DTO que aceita `privateKey` em texto
 * aberto passaria no e2e e falharia em campo.
 */

export type TestContext = {
  app: INestApplication;
  /**
   * Servidor HTTP já tipado, para o supertest.
   *
   * Resolver o tipo aqui, uma vez, mantém as specs livres de `no-unsafe-argument`
   * sem espalhar anotação por toda a suíte — o supertest recebe `any` de
   * `getHttpServer()` quando chamado direto na spec.
   */
  httpServer: Server;
  prisma: PrismaService;
  close: () => Promise<void>;
};

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
  const appConfig = app.get(AppConfigService);

  // `fatal` para que a saída do teste mostre falha de teste, e não o log
  // estruturado de cada requisição.
  const logger = new StructuredLogger('fatal');
  app.useLogger(logger);

  configureApp(app, appConfig, logger);

  await app.init();

  const prisma = app.get(PrismaService);
  const httpServer: Server = app.getHttpServer();

  return {
    app,
    httpServer,
    prisma,
    close: async () => {
      await app.close();
    },
  };
}
