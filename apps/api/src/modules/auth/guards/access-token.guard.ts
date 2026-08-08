import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';

import { ApiException } from '@/common/errors/api.exception';

import { IS_PUBLIC_ROUTE } from '../decorators/public-route.decorator';
import { AccessTokenService } from '../services/access-token.service';
import { RotateSessionService } from '../services/rotate-session.service';

/**
 * Guard do access token.
 *
 * Verifica a assinatura **e** consulta a sessão a cada requisição. É a segunda
 * parte que importa: `SECURITY.md` secao 29 diz que a expiração não é o
 * mecanismo de revogação, e sem a consulta ao `sid` revogar uma sessão só teria
 * efeito depois dos 15 minutos do token.
 *
 * Rotas públicas são declaradas com `@PublicRoute()`. O padrão é exigir
 * autenticação: uma rota nova nasce protegida, e esquecer o decorator produz
 * `401` em vez de acesso aberto.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokens: AccessTokenService,
    private readonly sessions: RotateSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic === true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = readBearerToken(request);

    if (token === null) {
      throw unauthorized('TOKEN_INVALID');
    }

    const claims = await this.accessTokens.verify(token);

    if (claims === null) {
      throw unauthorized('TOKEN_INVALID');
    }

    if (!(await this.sessions.isSessionValid(claims.sid, new Date()))) {
      throw unauthorized('SESSION_REVOKED');
    }

    request.auth = { userId: claims.sub, sessionId: claims.sid };

    return true;
  }
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.authorization;

  if (typeof header !== 'string') {
    return null;
  }

  const [scheme, value] = header.split(' ');

  // A comparação do esquema é insensível a maiúsculas por especificação
  // (RFC 9110 secao 11.1), e um valor vazio depois dele não é um token.
  if (scheme?.toLowerCase() !== 'bearer' || value === undefined || value.length === 0) {
    return null;
  }

  return value;
}

/**
 * Todas as recusas carregam a mesma mensagem pública.
 *
 * O `code` distingue token inválido de sessão revogada, porque o cliente precisa
 * saber se vale a pena tentar renovar. A mensagem não distingue, porque o
 * usuário não tem o que fazer com a diferença.
 */
function unauthorized(code: 'TOKEN_INVALID' | 'SESSION_REVOKED'): ApiException {
  return new ApiException(code, HttpStatus.UNAUTHORIZED, 'Sua sessão não está mais válida.');
}
