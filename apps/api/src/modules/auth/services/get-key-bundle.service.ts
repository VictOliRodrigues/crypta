import { HttpStatus, Injectable } from '@nestjs/common';

import { type AuthenticatedUser, type KeyBundlePayload } from '@crypta/contracts';

import { ApiException } from '@/common/errors/api.exception';

import { AuthRepository } from '../repositories/auth.repository';

/**
 * `GET /users/me` e `GET /users/me/key-bundle` (docs/API.md secoes 26 e 28).
 *
 * O bundle volta com a chave privada **cifrada**, exatamente como foi gravada. O
 * cliente a abre com a `UserEncryptionKey` derivada da senha, e a AAD amarra o
 * ciphertext à `publicKey` do próprio par — então uma troca de chave pública
 * feita pelo servidor é detectada aqui, no desbloqueio (ADR 0023).
 */
@Injectable()
export class GetKeyBundleService {
  constructor(private readonly repository: AuthRepository) {}

  async profile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.repository.findUserById(userId);

    if (user === null) {
      throw notFound();
    }

    return user;
  }

  async execute(userId: string): Promise<KeyBundlePayload> {
    const bundle = await this.repository.findKeyBundleByUserId(userId);

    if (bundle === null) {
      throw notFound();
    }

    return { ...bundle, kdfAlgorithm: 'ARGON2ID' };
  }
}

/**
 * A conta sumiu entre a emissão do token e esta consulta.
 *
 * Só acontece com exclusão concorrente. `404` em vez de `500`: não é falha do
 * servidor, e a sessão morre na próxima verificação do guard de qualquer forma.
 */
function notFound(): ApiException {
  return new ApiException('RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND, 'Conta não encontrada.');
}
