import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Request } from 'express';

import {
  type ApiSuccessResponse,
  type AuthenticatedUser,
  type KeyBundlePayload,
} from '@crypta/contracts';

import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';

import {
  type ChangePasswordRequest,
  changePasswordRequestSchema,
} from '../dto/change-password.schema';
import { requireAuth } from '../mappers/request-auth';
import { ChangePasswordService } from '../services/change-password.service';
import { GetKeyBundleService } from '../services/get-key-bundle.service';

/**
 * Perfil e material criptográfico do usuário autenticado
 * (docs/API.md secoes 26, 28 e 29).
 *
 * `PATCH /users/me` entra com o perfil, fora da R0.2.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly keyBundle: GetKeyBundleService,
    private readonly changePassword: ChangePasswordService,
  ) {}

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Perfil do usuário autenticado.' })
  @ApiOkResponse({ description: 'Perfil.' })
  async me(@Req() request: Request): Promise<ApiSuccessResponse<AuthenticatedUser>> {
    const auth = requireAuth(request);

    return { data: await this.keyBundle.profile(auth.userId) };
  }

  @Get('me/key-bundle')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Key bundle do usuário autenticado.',
    description:
      'A chave privada volta cifrada. O servidor não tem como abri-la: a UserEncryptionKey ' +
      'deriva da senha e nunca sai do cliente.',
  })
  @ApiOkResponse({ description: 'Key bundle.' })
  async bundle(@Req() request: Request): Promise<ApiSuccessResponse<KeyBundlePayload>> {
    const auth = requireAuth(request);

    return { data: await this.keyBundle.execute(auth.userId) };
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Troca o AuthSecret e reprotege a chave privada.',
    description:
      'O cliente deriva os dois AuthSecret e monta o bundle novo; o servidor nunca vê a senha ' +
      'nem a UserEncryptionKey. A chave pública precisa permanecer a mesma: é o endereço de ' +
      'todo envelope de cofre já selado.',
  })
  @ApiNoContentResponse({ description: 'Credencial trocada.' })
  async changeUserPassword(
    @Body(new ZodValidationPipe(changePasswordRequestSchema)) body: ChangePasswordRequest,
    @Req() request: Request,
  ): Promise<void> {
    const auth = requireAuth(request);

    await this.changePassword.execute({
      userId: auth.userId,
      // A sessão que faz a chamada é preservada: quem trocou a senha não precisa
      // entrar de novo, e derrubá-la junto transformaria a operação correta em
      // aparência de falha.
      sessionId: auth.sessionId,
      currentAuthSecret: body.currentAuthSecret,
      newAuthSecret: body.newAuthSecret,
      newKeyBundle: body.newKeyBundle,
      revokeOtherSessions: body.revokeOtherSessions,
    });
  }
}
