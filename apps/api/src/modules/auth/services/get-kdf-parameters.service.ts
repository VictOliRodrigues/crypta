import { createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type AuthParametersData } from '@crypta/contracts';

import { AuthRepository } from '../repositories/auth.repository';
import { ServerSecretService } from './server-secret.service';

/**
 * `GET /auth/parameters` (docs/API.md secao 21).
 *
 * Devolve os parâmetros KDF de uma conta existente, e parâmetros **sintéticos**
 * para um e-mail que não existe — estruturalmente idênticos, para que a resposta
 * não revele o cadastro (`SECURITY.md` secao 25).
 *
 * O ponto que é fácil errar: os sintéticos precisam ser **estáveis por e-mail**.
 * Sorteá-los a cada requisição faria duas consultas ao mesmo endereço devolverem
 * `kdfSalt` diferente, e a instabilidade seria por si só o oráculo que esta rota
 * existe para fechar — bastaria consultar duas vezes e comparar.
 *
 * A estabilidade vem de derivar do e-mail normalizado com o segredo do servidor
 * (ADR 0022): determinístico para quem tem o segredo, imprevisível para quem não
 * tem, e sem estado a guardar.
 */

/**
 * Parâmetros do decoy. São os do ADR 0018, e precisam ser os mesmos que uma
 * conta real usaria: valores diferentes distinguiriam os dois casos tão bem
 * quanto um campo `exists: false`.
 */
const DECOY_PARAMETERS = {
  kdfAlgorithm: 'ARGON2ID',
  kdfVersion: 1,
  kdfMemory: 65536,
  kdfIterations: 3,
  kdfParallelism: 1,
} as const;

const SALT_BYTES = 16;

@Injectable()
export class GetKdfParametersService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly serverSecret: ServerSecretService,
  ) {}

  async execute(email: string): Promise<AuthParametersData> {
    const stored = await this.repository.findKdfParametersByEmail(email);

    if (stored === null) {
      return this.syntheticParameters(email);
    }

    return {
      kdfAlgorithm: 'ARGON2ID',
      kdfVersion: stored.kdfVersion,
      kdfSalt: stored.kdfSalt,
      kdfMemory: stored.kdfMemory,
      kdfIterations: stored.kdfIterations,
      kdfParallelism: stored.kdfParallelism,
    };
  }

  /**
   * Salt derivado do e-mail, truncado nos 16 bytes que o libsodium exige.
   *
   * Truncar `HMAC-SHA-256` é seguro aqui: o valor não é chave nem segredo, só
   * precisa ser estável e não adivinhável sem o segredo do servidor.
   */
  private syntheticParameters(email: string): AuthParametersData {
    const salt = createHmac('sha256', this.serverSecret.kdfDecoySecret)
      .update(email)
      .digest()
      .subarray(0, SALT_BYTES);

    return { ...DECOY_PARAMETERS, kdfSalt: salt.toString('base64url') };
  }
}
