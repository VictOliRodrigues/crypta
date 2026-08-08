import { randomBytes } from 'node:crypto';

import { type AppConfigService } from '@/config/app-config.service';
import { type VersionedSecret } from '@/config/auth-env.schema';

import { ServerSecretService } from './server-secret.service';

/**
 * O que estes testes protegem é a separação de domínio do ADR 0022: o pepper do
 * verificador e o segredo dos parâmetros sintéticos vêm do mesmo material, e
 * precisam ser valores diferentes. Se coincidissem, vazar um entregaria o outro.
 */

const CURRENT: VersionedSecret = { version: 2, secret: new Uint8Array(randomBytes(32)) };
const PREVIOUS: VersionedSecret = { version: 1, secret: new Uint8Array(randomBytes(32)) };

function buildService(previous: VersionedSecret | null = null): ServerSecretService {
  const appConfig: Pick<AppConfigService, 'authServerSecret' | 'previousAuthServerSecret'> = {
    authServerSecret: CURRENT,
    previousAuthServerSecret: previous,
  };

  return new ServerSecretService(appConfig as AppConfigService);
}

const AUTH_SECRET = new Uint8Array(randomBytes(32));

describe('ServerSecretService', () => {
  describe('separação de domínio', () => {
    it('deriva pepper e segredo de decoy diferentes do mesmo material', () => {
      const service = buildService();

      const hash = service.computeAuthSecretHash(AUTH_SECRET);

      expect(service.kdfDecoySecret.toString('hex')).not.toBe(hash);
      expect(service.kdfDecoySecret).toHaveLength(32);
    });

    it('nunca expõe o AUTH_SERVER_SECRET bruto', () => {
      const service = buildService();

      expect(service.kdfDecoySecret.equals(Buffer.from(CURRENT.secret))).toBe(false);
    });
  });

  describe('computeAuthSecretHash', () => {
    it('é determinístico', () => {
      const service = buildService();

      expect(service.computeAuthSecretHash(AUTH_SECRET)).toBe(
        service.computeAuthSecretHash(AUTH_SECRET),
      );
    });

    it('produz 64 caracteres hexadecimais', () => {
      expect(buildService().computeAuthSecretHash(AUTH_SECRET)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('muda com o AuthSecret', () => {
      const service = buildService();

      expect(service.computeAuthSecretHash(new Uint8Array(randomBytes(32)))).not.toBe(
        service.computeAuthSecretHash(AUTH_SECRET),
      );
    });

    it('muda com a versão do segredo, que é o que torna a rotação efetiva', () => {
      const service = buildService(PREVIOUS);

      expect(service.computeAuthSecretHash(AUTH_SECRET, 1)).not.toBe(
        service.computeAuthSecretHash(AUTH_SECRET, 2),
      );
    });

    it('recusa uma versão que o ambiente não tem mais', () => {
      const service = buildService(PREVIOUS);

      expect(() => service.computeAuthSecretHash(AUTH_SECRET, 99)).toThrow(
        /Nenhum AUTH_SERVER_SECRET configurado/,
      );
    });

    it('recusa a versão anterior quando ela não foi provisionada', () => {
      const service = buildService(null);

      expect(() => service.computeAuthSecretHash(AUTH_SECRET, 1)).toThrow();
    });
  });

  describe('matchesAuthSecretHash', () => {
    it('reconhece o próprio hash', () => {
      const service = buildService();
      const hash = service.computeAuthSecretHash(AUTH_SECRET);

      expect(service.matchesAuthSecretHash(hash, hash)).toBe(true);
    });

    it('recusa hash diferente', () => {
      const service = buildService();

      expect(
        service.matchesAuthSecretHash(
          service.computeAuthSecretHash(new Uint8Array(randomBytes(32))),
          service.computeAuthSecretHash(AUTH_SECRET),
        ),
      ).toBe(false);
    });

    it('recusa comparação de tamanhos diferentes sem lançar', () => {
      const service = buildService();

      expect(service.matchesAuthSecretHash('aa', service.computeAuthSecretHash(AUTH_SECRET))).toBe(
        false,
      );
    });

    it('recusa valor vazio', () => {
      expect(buildService().matchesAuthSecretHash('', '')).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('pede recálculo quando a linha usa versão antiga', () => {
      const service = buildService(PREVIOUS);

      expect(service.needsRehash(1)).toBe(true);
      expect(service.needsRehash(2)).toBe(false);
    });

    it('reporta a versão corrente para gravar junto do verificador', () => {
      expect(buildService().currentVersion).toBe(2);
    });
  });
});
