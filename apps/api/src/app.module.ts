import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';

import { RequestIdMiddleware } from '@/common/http/request-id.middleware';
import { AppConfigModule } from '@/config/app-config.module';
import { PrismaModule } from '@/database/prisma/prisma.module';
import { HealthModule } from '@/modules/health/health.module';
import { SystemModule } from '@/modules/system/system.module';

@Module({
  imports: [AppConfigModule, PrismaModule, HealthModule, SystemModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Toda rota precisa de request ID, inclusive health: sem ele uma falha de
    // readiness não é correlacionável com o log.
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
