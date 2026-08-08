/**
 * Contexto de autenticação anexado pelo `AccessTokenGuard`.
 *
 * Fica em `Request` para que controllers e policies leiam sempre a mesma fonte.
 * `undefined` em rota pública — o tipo obriga a checagem, em vez de deixar um
 * `userId` vazio circular como se fosse válido.
 */
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

export {};
