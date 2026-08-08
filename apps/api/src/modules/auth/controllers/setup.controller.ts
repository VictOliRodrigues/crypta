import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';

import { type AuthSessionResponse, type SetupStatusResponse } from '@crypta/contracts';

import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';

import { idempotencyKeySchema, type SetupRequest, setupRequestSchema } from '../dto/setup.schema';
import { readSessionClient } from '../mappers/session-client.mapper';
import { CreateFirstUserService } from '../services/create-first-user.service';
import { SetupStatusService } from '../services/setup-status.service';

/**
 * Configuração inicial (docs/API.md secoes 19 e 20).
 *
 * As duas rotas são públicas. `POST /setup` só funciona enquanto
 * `setupRequired` é `true`, e a checagem acontece **dentro da transação** — a
 * versão que checa antes tem uma janela em que duas requisições concorrentes
 * criam duas contas.
 */
@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(
    private readonly setupStatus: SetupStatusService,
    private readonly createFirstUser: CreateFirstUserService,
  ) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Informa se o primeiro usuário precisa ser criado.' })
  @ApiOkResponse({ description: 'Estado da configuração inicial.' })
  async getStatus(): Promise<SetupStatusResponse> {
    return { data: await this.setupStatus.execute() };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Cria o primeiro usuário do sistema.' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID do cliente.' })
  @ApiBody({
    description:
      'Nome, e-mail, AuthSecret derivado no cliente e o key bundle. A senha original nunca é enviada.',
    schema: { type: 'object' },
  })
  async create(
    @Body(new ZodValidationPipe(setupRequestSchema)) body: SetupRequest,
    @Headers('idempotency-key') idempotencyKeyHeader: string | undefined,
    @Req() request: Request,
  ): Promise<AuthSessionResponse> {
    const idempotencyKey = new ZodValidationPipe(idempotencyKeySchema).transform(
      idempotencyKeyHeader,
    );

    const data = await this.createFirstUser.execute({
      name: body.name,
      email: body.email,
      authSecret: body.authSecret,
      keyBundle: body.keyBundle,
      idempotencyKey,
      client: readSessionClient(request),
    });

    return { data };
  }
}
