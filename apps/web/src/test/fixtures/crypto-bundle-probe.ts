/**
 * Entrada mínima usada pelo teste de bundle criptográfico.
 *
 * Existe só para forçar o bundler a incluir o `@crypta/crypto-web` e, por
 * consequência, o libsodium. Sem um uso real, o tree-shaking removeria tudo e o
 * teste passaria sem verificar nada.
 */

import { webCryptoAdapter } from '@crypta/crypto-web';

export async function probeCryptoBundle(): Promise<number> {
  await webCryptoAdapter.init();

  return webCryptoAdapter.random.getRandomBytes(1).length;
}
