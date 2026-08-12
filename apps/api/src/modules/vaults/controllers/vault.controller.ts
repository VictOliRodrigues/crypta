import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Request } from 'express';

import {
  type ApiSuccessResponse,
  type VaultCreatedData,
  type VaultDetail,
  type VaultListResponse,
  type VaultUpdatedData,
} from '@crypta/contracts';
import { vaultIdSchema } from '@crypta/validation';

import { getRequestId, type RequestWithId } from '@/common/http/request-id.middleware';
import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';

import { idempotencyKeySchema } from '../../auth/dto/setup.schema';
import { requireAuth } from '../../auth/mappers/request-auth';
import {
  type CreateVaultRequest,
  createVaultRequestSchema,
  type DeleteVaultRequest,
  deleteVaultRequestSchema,
  type ListVaultsQuery,
  listVaultsQuerySchema,
  type UpdateVaultRequest,
  updateVaultRequestSchema,
} from '../dto/vault.schema';
import { CreateVaultService } from '../services/create-vault.service';
import { DeleteVaultService } from '../services/delete-vault.service';
import { ListVaultsService } from '../services/list-vaults.service';
import { UpdateVaultService } from '../services/update-vault.service';

/**
 * Cofres (docs/API.md secoes 33 a 37).
 *
 * O `userId` vem sempre do token, nunca do caminho nem do corpo. É o que fecha
 * o IDOR que o `CLAUDE.md` secao 40 manda testar: um `vaultId` de outro usuário
 * não casa no `where` da policy, e a resposta é `404` — a mesma de um cofre que
 * não existe.
 *
 * `Cache-Control: no-store` em toda resposta com corpo. O corpo carrega
 * ciphertext, e nenhum intermediário precisa guardá-lo.
 */
@ApiTags('vaults')
@ApiBearerAuth()
@Controller('vaults')
export class VaultController {
  constructor(
    private readonly createVault: CreateVaultService,
    private readonly listVaults: ListVaultsService,
    private readonly updateVault: UpdateVaultService,
    private readonly deleteVault: DeleteVaultService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Lista os cofres acessíveis ao usuário autenticado.' })
  @ApiOkResponse({ description: 'Cofres acessíveis, com metadata ainda criptografada.' })
  async list(
    @Query(new ZodValidationPipe(listVaultsQuerySchema)) query: ListVaultsQuery,
    @Req() request: Request,
  ): Promise<VaultListResponse> {
    const auth = requireAuth(request);

    return this.listVaults.list(auth.userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Cria um cofre privado.',
    description:
      'O `id` é gerado pelo cliente (ADR 0025): a AAD da metadata é amarrada a ele antes desta requisição.',
  })
  @ApiCreatedResponse({ description: 'Cofre criado.' })
  async create(
    @Body(new ZodValidationPipe(createVaultRequestSchema)) body: CreateVaultRequest,
    @Headers('idempotency-key') idempotencyKeyHeader: string | undefined,
    @Req() request: Request,
  ): Promise<ApiSuccessResponse<VaultCreatedData>> {
    const auth = requireAuth(request);

    const idempotencyKey = new ZodValidationPipe(idempotencyKeySchema).transform(
      idempotencyKeyHeader,
    );

    return {
      data: await this.createVault.execute({
        ...body,
        userId: auth.userId,
        idempotencyKey,
        ...this.context(request),
      }),
    };
  }

  @Get(':vaultId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Retorna os metadados estruturais de um cofre.' })
  @ApiOkResponse({ description: 'Cofre acessível ao chamador.' })
  async findOne(
    @Param('vaultId', new ZodValidationPipe(vaultIdSchema)) vaultId: string,
    @Req() request: Request,
  ): Promise<ApiSuccessResponse<VaultDetail>> {
    const auth = requireAuth(request);

    return { data: await this.listVaults.findOne(vaultId, auth.userId) };
  }

  @Patch(':vaultId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Atualiza a metadata criptografada do cofre.',
    description: 'Somente o proprietário. Exige `expectedVersion`.',
  })
  @ApiOkResponse({ description: 'Metadata atualizada.' })
  async update(
    @Param('vaultId', new ZodValidationPipe(vaultIdSchema)) vaultId: string,
    @Body(new ZodValidationPipe(updateVaultRequestSchema)) body: UpdateVaultRequest,
    @Req() request: Request,
  ): Promise<ApiSuccessResponse<VaultUpdatedData>> {
    const auth = requireAuth(request);

    return {
      data: await this.updateVault.execute({
        vaultId,
        userId: auth.userId,
        body,
        ...this.context(request),
      }),
    };
  }

  @Delete(':vaultId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Exclui o cofre.',
    description:
      'Somente o proprietário. A exclusão é física e leva membros e envelopes junto (ADR 0020).',
  })
  @ApiNoContentResponse({ description: 'Cofre excluído.' })
  async remove(
    @Param('vaultId', new ZodValidationPipe(vaultIdSchema)) vaultId: string,
    @Body(new ZodValidationPipe(deleteVaultRequestSchema)) body: DeleteVaultRequest,
    @Req() request: Request,
  ): Promise<void> {
    const auth = requireAuth(request);

    await this.deleteVault.execute({
      vaultId,
      userId: auth.userId,
      expectedVersion: body.expectedVersion,
      ...this.context(request),
    });
  }

  /**
   * Metadados técnicos que a auditoria guarda.
   *
   * Nenhum deles é confiável — todos vêm do cliente ou do proxy — e nenhum
   * participa de decisão de autorização. Servem para reconstruir o que
   * aconteceu, não para decidir o que pode acontecer.
   */
  private context(request: Request): {
    requestId: string;
    ipAddress: string | null;
    userAgent: string | null;
  } {
    const userAgent = request.headers['user-agent'];

    return {
      requestId: getRequestId(request as RequestWithId),
      ipAddress: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
    };
  }
}
