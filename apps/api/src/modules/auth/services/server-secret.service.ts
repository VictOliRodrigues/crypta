import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfigService } from '@/config/app-config.service';
import { type VersionedSecret } from '@/config/auth-env.schema';

/**
 * Derivação e uso do segredo do servidor (ADR 0022).
 *
 * ```text
 * AUTH_SERVER_SECRET
 *     ├── HKDF-SHA-256(info="auth-secret-pepper")    → pepper do verificador
 *     └── HKDF-SHA-256(info="kdf-parameters-decoy")  → segredo dos parâmetros sintéticos
 * ```
 *
 * Um segredo por ambiente, com separação de domínio no mesmo espírito do ADR
 * 0004: usar o mesmo material bruto nos dois usos faria o pepper e o segredo dos
 * parâmetros sintéticos serem o mesmo valor, e vazar um entregaria o outro.
 */

/** Rótulos de HKDF. São constantes de protocolo: alterá-los invalida o que já existe. */
const HKDF_INFO = {
  authSecretPepper: 'auth-secret-pepper',
  kdfParametersDecoy: 'kdf-parameters-decoy',
} as const;

const DERIVED_KEY_BYTES = 32;

type DerivedSecrets = {
  version: number;
  pepper: Buffer;
  decoy: Buffer;
};

function derive(secret: VersionedSecret): DerivedSecrets {
  return {
    version: secret.version,
    pepper: Buffer.from(
      hkdfSync(
        'sha256',
        secret.secret,
        new Uint8Array(0),
        HKDF_INFO.authSecretPepper,
        DERIVED_KEY_BYTES,
      ),
    ),
    decoy: Buffer.from(
      hkdfSync(
        'sha256',
        secret.secret,
        new Uint8Array(0),
        HKDF_INFO.kdfParametersDecoy,
        DERIVED_KEY_BYTES,
      ),
    ),
  };
}

@Injectable()
export class ServerSecretService {
  private readonly current: DerivedSecrets;
  private readonly previous: DerivedSecrets | null;

  constructor(appConfig: AppConfigService) {
    this.current = derive(appConfig.authServerSecret);

    const previousSecret = appConfig.previousAuthServerSecret;
    this.previous = previousSecret === null ? null : derive(previousSecret);
  }

  /** Versão corrente, gravada junto do verificador que ela produziu. */
  get currentVersion(): number {
    return this.current.version;
  }

  /**
   * Verificador do `AuthSecret`: `HMAC-SHA-256(pepper, authSecret)` em hexadecimal.
   *
   * Rápido de propósito. O fator de trabalho contra a senha é o Argon2id do
   * cliente, que já foi pago; repeti-lo aqui abriria a rota de login — que não é
   * autenticada — à exaustão de memória (ADR 0022).
   */
  computeAuthSecretHash(authSecret: Uint8Array, version = this.current.version): string {
    const derived = this.secretsForVersion(version);

    return createHmac('sha256', derived.pepper).update(authSecret).digest('hex');
  }

  /**
   * Compara em tempo constante.
   *
   * `===` em string vaza o número de caracteres iguais pelo tempo de retorno, o
   * que sobre muitas tentativas permite reconstruir o verificador byte a byte.
   */
  matchesAuthSecretHash(candidate: string, stored: string): boolean {
    const candidateBytes = Buffer.from(candidate, 'hex');
    const storedBytes = Buffer.from(stored, 'hex');

    if (candidateBytes.length !== storedBytes.length || candidateBytes.length === 0) {
      return false;
    }

    return timingSafeEqual(candidateBytes, storedBytes);
  }

  /**
   * Segredo dos parâmetros KDF sintéticos.
   *
   * Sempre da versão corrente: um e-mail inexistente não tem linha no banco e,
   * portanto, não tem versão gravada.
   */
  get kdfDecoySecret(): Buffer {
    return this.current.decoy;
  }

  /** `true` quando o verificador da linha precisa ser recalculado no próximo login. */
  needsRehash(version: number): boolean {
    return version !== this.current.version;
  }

  /**
   * Segredos da versão pedida.
   *
   * Uma versão desconhecida é erro de configuração, não de requisição: a linha
   * referencia um segredo que o ambiente não tem mais. Falhar aqui é melhor do
   * que recusar o login do usuário como se a senha estivesse errada — o sintoma
   * apontaria para o lugar errado.
   */
  private secretsForVersion(version: number): DerivedSecrets {
    if (version === this.current.version) {
      return this.current;
    }

    if (this.previous !== null && version === this.previous.version) {
      return this.previous;
    }

    throw new Error(
      `Nenhum AUTH_SERVER_SECRET configurado para a versão ${String(version)}. ` +
        'A versão anterior não pode ser removida do ambiente enquanto houver linha que a referencie.',
    );
  }
}
