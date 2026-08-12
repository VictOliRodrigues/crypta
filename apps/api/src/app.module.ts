import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';

import { RequestIdMiddleware } from '@/common/http/request-id.middleware';
import { AppConfigModule } from '@/config/app-config.module';
import { PrismaModule } from '@/database/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { SystemModule } from '@/modules/system/system.module';
import { VaultsModule } from '@/modules/vaults/vaults.module';

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule, HealthModule, SystemModule, VaultsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Toda rota precisa de request ID, inclusive health: sem ele uma falha de
    // readiness não é correlacionável com o log.
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
