import { Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Request } from 'express';

import { type ApiSuccessResponse, type SessionView } from '@crypta/contracts';
import { uuidSchema } from '@crypta/validation';

import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';

import { requireAuth } from '../mappers/request-auth';
import { ListSessionsService } from '../services/list-sessions.service';
import { RotateSessionService } from '../services/rotate-session.service';

/**
 * Sessões do usuário (docs/API.md secoes 30 a 32).
 *
 * Toda rota aqui é escopada ao dono: o `userId` vem do token, nunca do caminho.
 * É o que fecha o IDOR que o `CLAUDE.md` secao 40 manda testar — um id de sessão
 * de outro usuário não casa no `where`, e a resposta é `404`.
 */
@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly listSessions: ListSessionsService,
    private readonly rotateSessions: RotateSessionService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Lista as sessões do usuário autenticado.' })
  @ApiOkResponse({ description: 'Sessões ativas.' })
  async list(@Req() request: Request): Promise<ApiSuccessResponse<SessionView[]>> {
    const auth = requireAuth(request);

    return { data: await this.listSessions.execute(auth) };
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga uma sessão específica.' })
  @ApiNoContentResponse({ description: 'Sessão revogada.' })
  async revokeOne(
    @Param('sessionId', new ZodValidationPipe(uuidSchema)) sessionId: string,
    @Req() request: Request,
  ): Promise<void> {
    const auth = requireAuth(request);

    await this.listSessions.revokeOwned(sessionId, auth.userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoga as demais sessões do usuário.',
    description: 'A sessão que fez a chamada permanece; para encerrá-la use POST /auth/logout.',
  })
  @ApiNoContentResponse({ description: 'Sessões revogadas.' })
  async revokeOthers(@Req() request: Request): Promise<void> {
    const auth = requireAuth(request);

    await this.rotateSessions.revokeAll({
      userId: auth.userId,
      exceptSessionId: auth.sessionId,
    });
  }
}
