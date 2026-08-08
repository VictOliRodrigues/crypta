import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

/**
 * Geração e hash do refresh token (ADR 0022).
 *
 * O token é opaco: 32 bytes de CSPRNG em base64url. Em repouso fica o
 * `SHA-256`, com índice único, e a busca é feita **pelo hash** — não há
 * varredura nem comparação linha a linha.
 *
 * Sem pepper, ao contrário do verificador do `AuthSecret`. O pepper existe para
 * impedir ataque offline contra segredo de entropia limitada — a senha. Aqui são
 * 256 bits sem estrutura, e o atacante não tem o que tentar. Acrescentá-lo seria
 * simetria estética, e faria a rotação do segredo do servidor derrubar todas as
 * sessões vivas.
 */

const TOKEN_BYTES = 32;

@Injectable()
export class RefreshTokenService {
  /** Token novo, em texto aberto. É a única vez que ele existe fora do cliente. */
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
