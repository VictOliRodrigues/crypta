import { HttpStatus } from '@nestjs/common';
import { type Request } from 'express';

import { ApiException } from '@/common/errors/api.exception';

/**
 * Contexto de autenticação de uma requisição já protegida.
 *
 * O `AccessTokenGuard` preenche `request.auth`, mas o tipo é opcional porque
 * rota pública não tem contexto. Esta função converte a ausência em erro
 * explícito em vez de deixar um `userId` vazio circular: se ela lançar, é porque
 * uma rota protegida ficou sem guard, e falhar alto é melhor do que consultar o
 * banco com `undefined`.
 */
export type RequestAuth = {
  userId: string;
  sessionId: string;
};

export function requireAuth(request: Request): RequestAuth {
  const auth = request.auth;

  if (auth === undefined) {
    throw new ApiException(
      'UNAUTHORIZED',
      HttpStatus.UNAUTHORIZED,
      'Sua sessão não está mais válida.',
    );
  }

  return auth;
}
