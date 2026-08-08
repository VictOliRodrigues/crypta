import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import { API_SERVICE_NAME, type LivenessResponse, type ReadinessResponse } from '@crypta/contracts';

import { ServiceUnavailableException } from '@/common/errors/api.exception';

import { HealthService } from './health.service';

/**
 * Endpoints públicos de health.
 *
 * Não exigem autenticação e não podem revelar hostname, versão de dependência,
 * string de conexão nem stack (docs/API.md secao 16).
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Verifica se o processo está ativo.' })
  @ApiOkResponse({ description: 'Processo ativo.' })
  getLiveness(): LivenessResponse {
    return {
      data: {
        status: 'ok',
        service: API_SERVICE_NAME,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Verifica se a API pode receber tráfego.' })
  @ApiOkResponse({ description: 'Dependências obrigatórias respondendo.' })
  @ApiServiceUnavailableResponse({ description: 'Alguma dependência obrigatória não respondeu.' })
  async getReadiness(): Promise<ReadinessResponse> {
    const isDatabaseReachable = await this.healthService.isDatabaseReachable();

    // Falha fechada: sem banco, a instância não deve receber tráfego.
    if (!isDatabaseReachable) {
      throw new ServiceUnavailableException();
    }

    // Banco alcançável com schema errado é pior do que banco fora do ar: a
    // instância aceitaria tráfego e falharia por dentro (docs/API.md secao 17).
    if (!(await this.healthService.areMigrationsApplied())) {
      throw new ServiceUnavailableException();
    }

    return { data: { status: 'ready', database: 'ok' } };
  }
}
