import { SetMetadata } from '@nestjs/common';

/**
 * Marca uma rota como pública.
 *
 * O padrão é o oposto: sem este decorator, o `AccessTokenGuard` exige token. Uma
 * rota nova nasce protegida, e esquecer de anotá-la produz `401` — falha visível
 * — em vez de acesso aberto, que passaria despercebido.
 */
export const IS_PUBLIC_ROUTE = 'crypta:isPublicRoute';

export const PublicRoute = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_ROUTE, true);
