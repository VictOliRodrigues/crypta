import { createPrivateKey, createPublicKey, type KeyObject } from 'node:crypto';

import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type JWTPayload, jwtVerify, SignJWT } from 'jose';

import { API_SERVICE_NAME } from '@crypta/contracts';

import { AppConfigService } from '@/config/app-config.service';

/**
 * Emissão e verificação do access token (ADR 0022).
 *
 * `EdDSA` sobre Ed25519, pela `jose`. Ed25519 não tem parâmetro para errar — sem
 * tamanho de chave como no RSA, sem nonce por assinatura como no ECDSA, cuja
 * reutilização revela a chave privada.
 *
 * O algoritmo esperado é **sempre** declarado na verificação. É isso que fecha
 * por construção a confusão de algoritmo: um token com `alg: none`, ou assinado
 * simetricamente com a chave pública como segredo, é recusado antes de qualquer
 * leitura de claim.
 *
 * A `jose` está presa na linha 5. A 6 é ESM puro, e esta aplicação é CommonJS —
 * o Node 24 até resolveria `require` de ESM em runtime, mas o Jest não, e a
 * suíte de e2e deixaria de carregar. Subir para a 6 exige converter a API para
 * ESM inteira, o que é mudança própria. A linha 5 continua recebendo correção de
 * segurança e tem a mesma API para o que é usado aqui.
 */

const ALGORITHM = 'EdDSA';
const CURVE = 'Ed25519';

/** Claims do token. Nada além disso: `SECURITY.md` secao 29 proíbe dado sensível. */
export type AccessTokenClaims = {
  /** Id do usuário. */
  sub: string;
  /** Id da sessão. A autorização o consulta a cada requisição. */
  sid: string;
};

@Injectable()
export class AccessTokenService implements OnModuleInit {
  private readonly privateKey: KeyObject;
  private readonly publicKey: KeyObject;
  private readonly issuer: string;
  private readonly ttlSeconds: number;

  constructor(appConfig: AppConfigService) {
    const { privateKeyPem, publicKeyPem } = appConfig.jwtKeys;

    this.privateKey = createPrivateKey(privateKeyPem);
    this.publicKey = createPublicKey(publicKeyPem);
    this.issuer = `${API_SERVICE_NAME}:${appConfig.environment}`;
    this.ttlSeconds = appConfig.tokenTtl.access;
  }

  /**
   * Self-test de partida: confirma que as duas chaves são Ed25519 e que formam
   * par, assinando e verificando um valor de prova.
   *
   * Chave trocada entre ambientes falha aqui, e não na primeira requisição real
   * de um usuário. É o mesmo raciocínio do self-test do `@crypta/crypto-web`:
   * recusar operar é melhor do que operar errado.
   */
  async onModuleInit(): Promise<void> {
    for (const [name, key] of [
      ['JWT_PRIVATE_KEY', this.privateKey],
      ['JWT_PUBLIC_KEY', this.publicKey],
    ] as const) {
      const details = key.asymmetricKeyDetails;

      if (key.asymmetricKeyType !== 'ed25519' && details?.namedCurve !== CURVE.toLowerCase()) {
        throw new Error(`${name} não é uma chave Ed25519.`);
      }
    }

    const probe = await this.issue({ sub: 'startup-probe', sid: 'startup-probe' });
    const claims = await this.verify(probe.token);

    if (claims === null || claims.sub !== 'startup-probe') {
      throw new Error(
        'JWT_PRIVATE_KEY e JWT_PUBLIC_KEY não formam um par: o token assinado não verificou. ' +
          'Confira se as duas vieram do mesmo ambiente.',
      );
    }
  }

  get expiresInSeconds(): number {
    return this.ttlSeconds;
  }

  async issue(claims: AccessTokenClaims): Promise<{ token: string; expiresIn: number }> {
    const token = await new SignJWT({ sid: claims.sid })
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuer(this.issuer)
      .setAudience(API_SERVICE_NAME)
      .setSubject(claims.sub)
      .setIssuedAt()
      .setExpirationTime(`${String(this.ttlSeconds)}s`)
      .sign(this.privateKey);

    return { token, expiresIn: this.ttlSeconds };
  }

  /**
   * Devolve as claims, ou `null` quando o token não serve.
   *
   * `null` em vez de exceção porque a distinção entre "expirado", "assinatura
   * inválida" e "audience errada" não pode chegar ao cliente: todas viram o
   * mesmo `401`. Guardar a causa aqui só criaria a tentação de vazá-la.
   */
  async verify(token: string): Promise<AccessTokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.publicKey, {
        algorithms: [ALGORITHM],
        issuer: this.issuer,
        audience: API_SERVICE_NAME,
      });

      return this.toClaims(payload);
    } catch {
      return null;
    }
  }

  private toClaims(payload: JWTPayload): AccessTokenClaims | null {
    const { sub, sid } = payload;

    if (typeof sub !== 'string' || typeof sid !== 'string') {
      return null;
    }

    return { sub, sid };
  }
}
