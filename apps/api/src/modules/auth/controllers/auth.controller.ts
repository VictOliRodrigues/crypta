import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { type Request, type Response } from 'express';

import {
  type AuthParametersResponse,
  type AuthSessionResponse,
  CLIENT_TYPES,
  type RefreshSessionResponse,
} from '@crypta/contracts';

import { ZodValidationPipe } from '@/common/validation/zod-validation.pipe';
import { AppConfigService } from '@/config/app-config.service';

import { PublicRoute } from '../decorators/public-route.decorator';
import { type LoginRequest, loginRequestSchema, refreshRequestSchema } from '../dto/auth.schema';
import { type AuthParametersQuery, authParametersQuerySchema } from '../dto/setup.schema';
import {
  AccountDisabledException,
  AccountLockedException,
  InvalidCredentialsException,
  RefreshTokenInvalidException,
  RefreshTokenReusedException,
} from '../errors/auth.errors';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../http/refresh-cookie';
import { requireAuth } from '../mappers/request-auth';
import { readSessionClient } from '../mappers/session-client.mapper';
import { GetKdfParametersService } from '../services/get-kdf-parameters.service';
import { LoginService } from '../services/login.service';
import { RotateSessionService } from '../services/rotate-session.service';
import { type IssuedSession } from '../services/session-issuer.service';

/**
 * Autenticação (docs/API.md secoes 21 a 25).
 *
 * O refresh token nunca aparece no corpo para a Web: ele vai em cookie
 * `HttpOnly`, fora do alcance do JavaScript. No Android não há cookie, e ele
 * volta no corpo para ser guardado no Keystore (ADR 0021).
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly kdfParameters: GetKdfParametersService,
    private readonly login: LoginService,
    private readonly sessions: RotateSessionService,
    private readonly appConfig: AppConfigService,
  ) {}

  @PublicRoute()
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

  @PublicRoute()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Autentica com o AuthSecret derivado no cliente.',
    description:
      'Credencial errada, conta inexistente e conta bloqueada devolvem o mesmo ' +
      'INVALID_CREDENTIALS. O estado da conta só é revelado a quem já apresentou o AuthSecret correto.',
  })
  @ApiOkResponse({ description: 'Sessão criada.' })
  async authenticate(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    const outcome = await this.login.execute({
      email: body.email,
      authSecret: body.authSecret,
      client: { ...readSessionClient(request), ...clientOverride(body) },
      now: new Date(),
    });

    switch (outcome.kind) {
      case 'invalid':
        throw new InvalidCredentialsException();
      case 'locked':
        throw new AccountLockedException(outcome.retryAfterSeconds);
      case 'disabled':
        throw new AccountDisabledException();
      case 'authenticated':
        return {
          data: {
            user: outcome.user,
            ...this.deliverSession(outcome.session, request, response),
          },
        };
    }
  }

  @PublicRoute()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Rotaciona o refresh token e emite um access token novo.',
    description:
      'Apresentar o token anterior dentro da janela de 10 segundos não é reuso e devolve ' +
      'um par novo, sem estender a inatividade (ADR 0024). Fora dela, a família inteira cai.',
  })
  @ApiOkResponse({ description: 'Par renovado.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshSessionResponse> {
    const presented = this.readPresentedToken(request);
    const outcome = await this.sessions.execute({ refreshToken: presented, now: new Date() });

    if (outcome.kind === 'reused') {
      clearRefreshCookie(response, { sameSite: this.appConfig.refreshCookieSameSite });

      throw new RefreshTokenReusedException();
    }

    if (outcome.kind === 'invalid') {
      clearRefreshCookie(response, { sameSite: this.appConfig.refreshCookieSameSite });

      throw new RefreshTokenInvalidException();
    }

    return { data: this.deliverSession(outcome.session, request, response) };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerra a sessão atual.' })
  @ApiNoContentResponse({ description: 'Sessão encerrada.' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const auth = requireAuth(request);

    await this.sessions.revokeCurrent(auth.sessionId);

    clearRefreshCookie(response, { sameSite: this.appConfig.refreshCookieSameSite });
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga todas as sessões do usuário, inclusive esta.' })
  @ApiNoContentResponse({ description: 'Sessões revogadas.' })
  async logoutAll(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const auth = requireAuth(request);

    await this.sessions.revokeAll({ userId: auth.userId });

    clearRefreshCookie(response, { sameSite: this.appConfig.refreshCookieSameSite });
  }

  /**
   * Lê o refresh token da requisição.
   *
   * Na Web vem do cookie; no Android, do corpo. Mais de uma ocorrência do cookie
   * é recusada sem escolher entre elas: a ordem não é garantida por
   * especificação, e um subdomínio irmão comprometido pode gravar um cookie de
   * mesmo nome com escopo mais amplo (ADR 0021).
   */
  private readPresentedToken(request: Request): string {
    const cookie = readRefreshCookie(request);

    if (cookie.kind === 'duplicated') {
      throw new RefreshTokenInvalidException();
    }

    if (cookie.kind === 'single') {
      return cookie.value;
    }

    const parsed = refreshRequestSchema.safeParse(request.body);

    if (!parsed.success || parsed.data.refreshToken === undefined) {
      throw new RefreshTokenInvalidException();
    }

    return parsed.data.refreshToken;
  }

  /**
   * Entrega o par ao cliente certo.
   *
   * A Web recebe o refresh em cookie e **não** no corpo. Devolvê-lo nos dois
   * lugares anularia o `HttpOnly`: bastaria ler a resposta em JavaScript.
   */
  private deliverSession(
    session: IssuedSession,
    request: Request,
    response: Response,
  ): { accessToken: string; expiresIn: number; refreshToken?: string } {
    const clientType = readSessionClient(request).type;

    if (clientType === 'android') {
      return {
        accessToken: session.accessToken,
        expiresIn: session.expiresIn,
        refreshToken: session.refreshToken,
      };
    }

    setRefreshCookie(response, session.refreshToken, {
      sameSite: this.appConfig.refreshCookieSameSite,
      maxAgeSeconds: this.appConfig.tokenTtl.refreshIdle,
    });

    return { accessToken: session.accessToken, expiresIn: session.expiresIn };
  }
}

/** O cliente pode declarar tipo e nome no corpo do login (docs/API.md secao 22). */
function clientOverride(body: LoginRequest): {
  type?: 'web' | 'android' | 'extension';
  name?: string;
} {
  if (body.client === undefined) {
    return {};
  }

  const type = CLIENT_TYPES.includes(body.client.type) ? body.client.type : undefined;

  return {
    ...(type === undefined ? {} : { type }),
    ...(body.client.name === undefined ? {} : { name: body.client.name }),
  };
}
