import { describe, expect, it } from 'vitest';

import { type Argon2idParameters, HKDF_INFO, type KdfAdapter } from '../adapters/crypto-adapters';
import {
  AUTH_SECRET_BYTES,
  deriveIdentitySecrets,
  ROOT_KEY_BYTES,
  USER_ENCRYPTION_KEY_BYTES,
} from './derive-identity';

/**
 * Adapter de registro, não de criptografia.
 *
 * O que este arquivo prova é a fiação: quais rótulos de HKDF são usados, quantas
 * vezes o Argon2id roda e com que tamanhos. A corretude das primitivas é provada
 * em `@crypta/crypto-web`, contra `@noble/*`.
 */
function recordingKdf(): {
  adapter: KdfAdapter;
  rootKeyCalls: { password: string; keyLength: number }[];
  subKeyCalls: { info: string; keyLength: number }[];
} {
  const rootKeyCalls: { password: string; keyLength: number }[] = [];
  const subKeyCalls: { info: string; keyLength: number }[] = [];

  const adapter: KdfAdapter = {
    deriveRootKey({ password, keyLength }) {
      rootKeyCalls.push({ password, keyLength });

      return Promise.resolve(new Uint8Array(keyLength).fill(0x11));
    },
    deriveSubKey({ info, keyLength }) {
      subKeyCalls.push({ info, keyLength });

      // Saída dependente da `info`, para que dois rótulos iguais produzissem
      // duas chaves iguais e o teste de separação de domínio pudesse falhar.
      return Promise.resolve(new Uint8Array(keyLength).fill(info.length));
    },
  };

  return { adapter, rootKeyCalls, subKeyCalls };
}

const PARAMETERS: Argon2idParameters = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
  salt: 'AQIDBAUGBwgJCgsMDQ4PEA',
};

describe('deriveIdentitySecrets', () => {
  it('runs Argon2id once and derives both secrets from the same RootKey', async () => {
    const { adapter, rootKeyCalls, subKeyCalls } = recordingKdf();

    await deriveIdentitySecrets({
      kdf: adapter,
      password: 'senha-de-teste',
      parameters: PARAMETERS,
    });

    expect(rootKeyCalls).toEqual([{ password: 'senha-de-teste', keyLength: ROOT_KEY_BYTES }]);
    expect(subKeyCalls).toHaveLength(2);
  });

  it('uses the two protocol labels, and never the same one twice', async () => {
    const { adapter, subKeyCalls } = recordingKdf();

    await deriveIdentitySecrets({ kdf: adapter, password: 'senha', parameters: PARAMETERS });

    const labels = subKeyCalls.map((call) => call.info);

    expect(labels).toContain(HKDF_INFO.auth);
    expect(labels).toContain(HKDF_INFO.userEncryption);
    expect(new Set(labels).size).toBe(2);
  });

  it('produces different material for authentication and for encryption', async () => {
    const { adapter } = recordingKdf();

    const secrets = await deriveIdentitySecrets({
      kdf: adapter,
      password: 'senha',
      parameters: PARAMETERS,
    });

    expect(secrets.authSecret).not.toEqual(secrets.userEncryptionKey);
  });

  it('asks for the sizes SECURITY.md secao 14 fixes', async () => {
    const { adapter } = recordingKdf();

    const secrets = await deriveIdentitySecrets({
      kdf: adapter,
      password: 'senha',
      parameters: PARAMETERS,
    });

    expect(secrets.authSecret).toHaveLength(AUTH_SECRET_BYTES);
    expect(secrets.userEncryptionKey).toHaveLength(USER_ENCRYPTION_KEY_BYTES);
  });

  it('does not return the RootKey, which has no use of its own', async () => {
    const { adapter } = recordingKdf();

    const secrets = await deriveIdentitySecrets({
      kdf: adapter,
      password: 'senha',
      parameters: PARAMETERS,
    });

    expect(Object.keys(secrets).sort()).toEqual(['authSecret', 'userEncryptionKey']);
  });
});
