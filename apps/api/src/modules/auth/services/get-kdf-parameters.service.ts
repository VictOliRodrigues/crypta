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

    return stored === null
      ? buildParameters({ ...DECOY_PARAMETERS, kdfSalt: this.syntheticSalt(email) })
      : buildParameters({ ...stored, kdfSalt: stored.kdfSalt });
  }

  /**
   * Salt derivado do e-mail, truncado nos 16 bytes que o libsodium exige.
   *
   * Truncar `HMAC-SHA-256` é seguro aqui: o valor não é chave nem segredo, só
   * precisa ser estável e não adivinhável sem o segredo do servidor.
   */
  private syntheticSalt(email: string): string {
    return createHmac('sha256', this.serverSecret.kdfDecoySecret)
      .update(email)
      .digest()
      .subarray(0, SALT_BYTES)
      .toString('base64url');
  }
}

/**
 * Única montagem da resposta, para os dois caminhos.
 *
 * ## Por que uma função em vez de dois literais
 *
 * `JSON.stringify` preserva a ordem de inserção das chaves, então "resposta
 * estruturalmente idêntica" (`SECURITY.md` secao 25) inclui a **ordem**, não só
 * o conjunto de campos e os valores.
 *
 * Enquanto existiam dois literais, eles divergiram: o caminho real emitia
 * `kdfSalt` em terceiro e o decoy em último, porque o decoy era um espalhamento
 * de `DECOY_PARAMETERS` seguido do salt. Os valores eram indistinguíveis e a
 * posição do `kdfSalt` entregava a existência da conta com 100% de precisão, em
 * uma única requisição — o oráculo que esta rota inteira existe para fechar.
 *
 * Passar os dois caminhos por aqui não é estilo: é o que remove a possibilidade
 * de divergirem de novo. Um campo novo acrescentado a um só dos literais
 * recriaria o vazamento sem que nenhum valor mudasse.
 */
function buildParameters(input: {
  kdfVersion: number;
  kdfSalt: string;
  kdfMemory: number;
  kdfIterations: number;
  kdfParallelism: number;
}): AuthParametersData {
  return {
    kdfAlgorithm: 'ARGON2ID',
    kdfVersion: input.kdfVersion,
    kdfSalt: input.kdfSalt,
    kdfMemory: input.kdfMemory,
    kdfIterations: input.kdfIterations,
    kdfParallelism: input.kdfParallelism,
  };
}
