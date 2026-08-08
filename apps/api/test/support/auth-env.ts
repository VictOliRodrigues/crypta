import { generateKeyPairSync, randomBytes } from 'node:crypto';

/**
 * Segredos descartáveis para a suíte de e2e.
 *
 * Gerados a cada execução, nunca versionados e nunca reaproveitados fora do
 * processo de teste. O `setup-e2e.ts` os coloca em `process.env` antes de a
 * aplicação subir, porque a validação de partida recusa subir sem eles.
 */
export function buildTestAuthEnv(): Record<string, string> {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  return {
    AUTH_SERVER_SECRET: `v1:${randomBytes(32).toString('base64url')}`,
    JWT_PRIVATE_KEY: Buffer.from(
      privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    ).toString('base64'),
    JWT_PUBLIC_KEY: Buffer.from(
      publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    ).toString('base64'),
  };
}
