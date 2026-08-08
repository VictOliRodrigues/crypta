import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { type AuthParametersResponse } from '@crypta/contracts';

import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';

import { type AuthParametersQuery, authParametersQuerySchema } from '../dto/setup.schema';
import { GetKdfParametersService } from '../services/get-kdf-parameters.service';

/**
 * Autenticação (docs/API.md secoes 21 e 22).
 *
 * `/auth/login`, `/auth/refresh` e `/auth/logout` entram junto com o ciclo de
 * sessão, em `BLG-0805` e `BLG-0806`.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly kdfParameters: GetKdfParametersService) {}

  @Get('parameters')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Parâmetros de derivação para um e-mail.',
    description:
      'Para e-mail inexistente devolve parâmetros sintéticos, estáveis por e-mail e ' +
      'estruturalmente idênticos aos reais. A resposta não revela se a conta existe.',
  })
  @ApiQuery({ name: 'email', required: true })
  @ApiOkResponse({ description: 'Parâmetros de derivação.' })
  async getParameters(
    @Query(new ZodValidationPipe(authParametersQuerySchema)) query: AuthParametersQuery,
  ): Promise<AuthParametersResponse> {
    return { data: await this.kdfParameters.execute(query.email) };
  }
}
