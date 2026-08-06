import { Global, Module } from '@nestjs/common';

import { AppConfigService } from './app-config.service';
import { parseEnv } from './env.schema';

/**
 * A validação roda uma única vez, na construção do módulo. Se falhar, o
 * processo não sobe.
 */
@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useFactory: (): AppConfigService => new AppConfigService(parseEnv(process.env)),
    },
  ],
  exports: [AppConfigService],
})
export class AppConfigModule {}
