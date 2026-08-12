import { describe, expect, it } from 'vitest';

import {
  type KeyExchangeAdapter,
  type KeyPair,
  type RandomSource,
} from '../adapters/crypto-adapters';
import { fromBase64Url, toBase64Url } from '../encoding/base64url';
import { CryptoAlgorithmError, CryptoFormatError } from '../errors';
import { KEY_ENVELOPE_ALGORITHM, parseKeyEnvelope } from '../format/key-envelope';
import {
  createVaultKey,
  createVaultKeyEnvelope,
  INITIAL_KEY_VERSION,
  openVaultKeyEnvelope,
  VAULT_KEY_BYTES,
} from './vault-key';

/**
 * Adapter de registro, não de criptografia.
 *
 * O que se prova aqui é o que foi passado ao adapter, o que a validação recusa
 * antes de chegar nele e o que acontece quando ele devolve algo inesperado. Que
 * o envelope real falhe diante de adulteração byte a byte é provado em
 * `@crypta/crypto-web`, com as primitivas de verdade.
 */
const EPHEMERAL_PUBLIC_KEY = new Uint8Array(32).fill(0x11);
const FAKE_TAG = new Uint8Array(16).fill(0x99);

const RECIPIENT: KeyPair = {
  publicKey: new Uint8Array(32).fill(0xaa),
  privateKey: new Uint8Array(32).fill(0xbb),
};

type SealCall = { recipientPublicKey: Uint8Array; plaintext: Uint8Array };

function stubKeyExchange(options: { openTo?: Uint8Array } = {}): {
  keyExchange: KeyExchangeAdapter;
  sealCalls: SealCall[];
  openCalls: number;
} {
  const sealCalls: SealCall[] = [];
  let openCalls = 0;

  const keyExchange: KeyExchangeAdapter = {
    generateKeyPair: () => Promise.resolve(RECIPIENT),

    sealForPublicKey({ recipientPublicKey, plaintext }) {
      sealCalls.push({ recipientPublicKey, plaintext });

      // Enquadramento igual ao do adapter real: chave efêmera, ciphertext, tag.
      // O XOR com 0xff é reversível e diferente do plaintext, para que um
      // retorno acidental do texto aberto não passe despercebido.
      const sealed = new Uint8Array(
        EPHEMERAL_PUBLIC_KEY.length + plaintext.length + FAKE_TAG.length,
      );

      sealed.set(EPHEMERAL_PUBLIC_KEY, 0);
      sealed.set(
        plaintext.map((byte) => byte ^ 0xff),
        EPHEMERAL_PUBLIC_KEY.length,
      );
      sealed.set(FAKE_TAG, EPHEMERAL_PUBLIC_KEY.length + plaintext.length);

      return Promise.resolve(sealed);
    },

    openWithPrivateKey({ ciphertext }) {
      openCalls += 1;

      if (options.openTo) {
        return Promise.resolve(options.openTo);
      }

      const body = ciphertext.subarray(
        EPHEMERAL_PUBLIC_KEY.length,
        ciphertext.length - FAKE_TAG.length,
      );

      return Promise.resolve(body.map((byte) => byte ^ 0xff));
    },
  };

  return {
    keyExchange,
    sealCalls,
    get openCalls() {
      return openCalls;
    },
  };
}

function fixedRandom(value: Uint8Array): RandomSource {
  return { getRandomBytes: () => value };
}

const VAULT_KEY = new Uint8Array(VAULT_KEY_BYTES).fill(0x5c);

describe('geração da VaultKey', () => {
  it('pede exatamente 32 bytes à fonte e devolve o que ela deu', () => {
    const requested: number[] = [];

    const random: RandomSource = {
      getRandomBytes: (length) => {
        requested.push(length);

        return VAULT_KEY;
      },
    };

    expect(createVaultKey(random)).toEqual(VAULT_KEY);
    expect(requested).toEqual([VAULT_KEY_BYTES]);
  });

  it('recusa uma fonte que devolve menos bytes do que os pedidos', () => {
    expect(() => createVaultKey(fixedRandom(new Uint8Array(16).fill(0x5c)))).toThrow(
      CryptoFormatError,
    );
  });

  /**
   * Um `Uint8Array` alocado e nunca preenchido tem exatamente esta cara. Cifrar
   * o cofre com uma chave de zeros falharia em silêncio.
   */
  it('recusa uma fonte que devolve apenas zeros', () => {
    expect(() => createVaultKey(fixedRandom(new Uint8Array(VAULT_KEY_BYTES)))).toThrow(
      CryptoFormatError,
    );
  });
});

describe('envelope da VaultKey', () => {
  it('sela a VaultKey para a chave pública informada', async () => {
    const { keyExchange, sealCalls } = stubKeyExchange();

    await createVaultKeyEnvelope({
      keyExchange,
      vaultKey: VAULT_KEY,
      recipientPublicKey: RECIPIENT.publicKey,
    });

    expect(sealCalls).toHaveLength(1);
    expect(sealCalls[0]?.recipientPublicKey).toEqual(RECIPIENT.publicKey);
    expect(sealCalls[0]?.plaintext).toEqual(VAULT_KEY);
  });

  it('produz um envelope que parseKeyEnvelope aceita, com o algoritmo real', async () => {
    const { keyExchange } = stubKeyExchange();

    const envelope = await createVaultKeyEnvelope({
      keyExchange,
      vaultKey: VAULT_KEY,
      recipientPublicKey: RECIPIENT.publicKey,
    });

    expect(parseKeyEnvelope({ ...envelope })).toEqual(envelope);
    expect(envelope.algorithm).toBe(KEY_ENVELOPE_ALGORITHM);
    expect(fromBase64Url(envelope.ephemeralPublicKey)).toEqual(EPHEMERAL_PUBLIC_KEY);
  });

  it('usa a primeira versão de chave quando nenhuma é informada', async () => {
    const { keyExchange } = stubKeyExchange();

    const envelope = await createVaultKeyEnvelope({
      keyExchange,
      vaultKey: VAULT_KEY,
      recipientPublicKey: RECIPIENT.publicKey,
    });

    expect(envelope.keyVersion).toBe(INITIAL_KEY_VERSION);
  });

  /** O rekey da R0.5 refaz os envelopes com a versão seguinte. */
  it('preserva a versão de chave informada', async () => {
    const { keyExchange } = stubKeyExchange();

    const envelope = await createVaultKeyEnvelope({
      keyExchange,
      vaultKey: VAULT_KEY,
      recipientPublicKey: RECIPIENT.publicKey,
      keyVersion: 7,
    });

    expect(envelope.keyVersion).toBe(7);
  });

  it('recusa versão de chave que não seja inteiro positivo', async () => {
    const { keyExchange, sealCalls } = stubKeyExchange();

    await expect(
      createVaultKeyEnvelope({
        keyExchange,
        vaultKey: VAULT_KEY,
        recipientPublicKey: RECIPIENT.publicKey,
        keyVersion: 0,
      }),
    ).rejects.toThrow(CryptoFormatError);

    expect(sealCalls).toHaveLength(0);
  });

  it('recusa VaultKey de tamanho errado sem chamar o adapter', async () => {
    const { keyExchange, sealCalls } = stubKeyExchange();

    await expect(
      createVaultKeyEnvelope({
        keyExchange,
        vaultKey: new Uint8Array(16).fill(0x5c),
        recipientPublicKey: RECIPIENT.publicKey,
      }),
    ).rejects.toThrow(CryptoFormatError);

    expect(sealCalls).toHaveLength(0);
  });

  it('recusa chave pública de tamanho errado sem chamar o adapter', async () => {
    const { keyExchange, sealCalls } = stubKeyExchange();

    await expect(
      createVaultKeyEnvelope({
        keyExchange,
        vaultKey: VAULT_KEY,
        recipientPublicKey: new Uint8Array(31).fill(0xaa),
      }),
    ).rejects.toThrow(CryptoFormatError);

    expect(sealCalls).toHaveLength(0);
  });
});

describe('abertura do envelope da VaultKey', () => {
  async function sealed(): Promise<{
    envelope: Awaited<ReturnType<typeof createVaultKeyEnvelope>>;
  }> {
    const { keyExchange } = stubKeyExchange();

    return {
      envelope: await createVaultKeyEnvelope({
        keyExchange,
        vaultKey: VAULT_KEY,
        recipientPublicKey: RECIPIENT.publicKey,
      }),
    };
  }

  it('faz roundtrip da VaultKey', async () => {
    const { envelope } = await sealed();
    const { keyExchange } = stubKeyExchange();

    const vaultKey = await openVaultKeyEnvelope({
      keyExchange,
      recipientKeyPair: RECIPIENT,
      envelope,
    });

    expect(vaultKey).toEqual(VAULT_KEY);
  });

  /**
   * O envelope chega do servidor. Um algoritmo que este cliente não implementa
   * é recusado aqui, e não entregue ao adapter para ver o que acontece.
   */
  it('valida a estrutura antes de chamar o adapter', async () => {
    const { envelope } = await sealed();
    const stub = stubKeyExchange();

    await expect(
      openVaultKeyEnvelope({
        keyExchange: stub.keyExchange,
        recipientKeyPair: RECIPIENT,
        envelope: { ...envelope, algorithm: 'X25519-XCHACHA20-POLY1305' },
      }),
    ).rejects.toThrow(CryptoAlgorithmError);

    expect(stub.openCalls).toBe(0);
  });

  it('recusa envelope sem os campos obrigatórios', async () => {
    const { envelope } = await sealed();
    const stub = stubKeyExchange();

    await expect(
      openVaultKeyEnvelope({
        keyExchange: stub.keyExchange,
        recipientKeyPair: RECIPIENT,
        envelope: { ...envelope, ephemeralPublicKey: undefined },
      }),
    ).rejects.toThrow(CryptoFormatError);

    expect(stub.openCalls).toBe(0);
  });

  /**
   * A AEAD autentica o conteúdo, não o significado dele. Um envelope legítimo
   * de outra coisa abriria sem erro e devolveria material do tamanho errado
   * para cifrar o cofre.
   */
  it('falha fechado quando o conteúdo aberto não tem 32 bytes', async () => {
    const { envelope } = await sealed();
    const { keyExchange } = stubKeyExchange({ openTo: new Uint8Array(16).fill(0x5c) });

    await expect(
      openVaultKeyEnvelope({ keyExchange, recipientKeyPair: RECIPIENT, envelope }),
    ).rejects.toThrow(CryptoFormatError);
  });

  it('recusa envelope cuja chave pública efêmera não tem 32 bytes', async () => {
    const { envelope } = await sealed();
    const stub = stubKeyExchange();

    await expect(
      openVaultKeyEnvelope({
        keyExchange: stub.keyExchange,
        recipientKeyPair: RECIPIENT,
        envelope: { ...envelope, ephemeralPublicKey: toBase64Url(new Uint8Array(31).fill(0x11)) },
      }),
    ).rejects.toThrow(CryptoFormatError);

    expect(stub.openCalls).toBe(0);
  });
});
