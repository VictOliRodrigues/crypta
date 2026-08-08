import { Controller, Get, Header, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';

import {
  type ApiSuccessResponse,
  type AuthenticatedUser,
  type KeyBundlePayload,
} from '@crypta/contracts';

import { requireAuth } from '../mappers/request-auth';
import { GetKeyBundleService } from '../services/get-key-bundle.service';

/**
 * Perfil e material criptográfico do usuário autenticado
 * (docs/API.md secoes 26 e 28).
 *
 * `PATCH /users/me` e `POST /users/me/change-password` entram com o `BLG-0807`.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly keyBundle: GetKeyBundleService) {}

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
}
