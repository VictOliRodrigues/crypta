import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { API_SERVICE_NAME, type VersionResponse } from '@crypta/contracts';

import { AppConfigService } from '@/config/app-config.service';
import { PublicRoute } from '@/modules/auth/decorators/public-route.decorator';

/**
 * `GET /version` — identifica exatamente o artefato implantado
 * (docs/API.md secao 18).
 *
 * É a evidência operacional de que produção executa o mesmo digest homologado
 * em staging, e a primeira coisa a conferir em qualquer rollback.
 */
@ApiTags('system')
@Controller('version')
export class VersionController {
  constructor(private readonly appConfig: AppConfigService) {}

  @PublicRoute()
  @Get()
  // Sem `no-store` uma resposta em cache identificaria a versão errada depois
  // de um deploy, tornando a verificação inútil.
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Retorna versão, commit, ambiente e horário do build.' })
  @ApiOkResponse({ description: 'Metadados do artefato implantado.' })
  getVersion(): VersionResponse {
    const { version, commit, builtAt } = this.appConfig.buildInfo;

    return {
      data: {
        service: API_SERVICE_NAME,
        version,
        commit,
        environment: this.appConfig.environment,
        builtAt,
      },
    };
  }
}
