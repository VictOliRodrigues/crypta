import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Protege a invariante de cabeçalhos de segurança do Nginx.
 *
 * O nginx só herda `add_header` de um nível para o outro quando o nível atual
 * não declara nenhum `add_header` próprio. Um `add_header Cache-Control`
 * dentro de um `location` descarta, em silêncio, toda a CSP e os demais
 * cabeçalhos definidos no `server`.
 *
 * Essa regressão já aconteceu: `location = /index.html` e `location /assets/`
 * definiam `Cache-Control` e a SPA inteira era servida sem cabeçalho de
 * segurança nenhum. Como o nginx não avisa e o build passa, o erro só aparece
 * inspecionando a resposta HTTP de um container em execução.
 *
 * O teste lê o arquivo de configuração como texto porque é exatamente assim
 * que ele chega à imagem: não existe etapa de compilação onde o erro pudesse
 * ser detectado antes.
 */

const SNIPPET_INCLUDE = 'include /etc/nginx/snippets/security-headers.conf;';

const readConfig = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

/** Extrai os blocos `location` de primeiro nível com o corpo correspondente. */
function extractLocationBlocks(config: string): { header: string; body: string }[] {
  const blocks: { header: string; body: string }[] = [];
  const locationPattern = /location\s+([^{]+?)\s*\{/g;

  let match = locationPattern.exec(config);

  while (match !== null) {
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let cursor = bodyStart;

    while (cursor < config.length && depth > 0) {
      const character = config[cursor];

      if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
      }

      cursor += 1;
    }

    blocks.push({
      header: `location ${match[1]}`,
      body: config.slice(bodyStart, cursor - 1),
    });

    match = locationPattern.exec(config);
  }

  return blocks;
}

describe('nginx.conf', () => {
  const config = readConfig('../../nginx.conf');
  const blocks = extractLocationBlocks(config);

  it('declara ao menos um location', () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('inclui os cabeçalhos de segurança no nível do server', () => {
    expect(config).toContain(SNIPPET_INCLUDE);
  });

  it.each(blocks.map((block) => [block.header, block] as const))(
    '%s inclui os cabeçalhos de segurança',
    (_header, block) => {
      expect(block.body).toContain(SNIPPET_INCLUDE);
    },
  );

  it('não define add_header de segurança fora do snippet', () => {
    const securityHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
    ];

    for (const header of securityHeaders) {
      expect(config).not.toMatch(new RegExp(`^\\s*add_header\\s+${header}`, 'm'));
    }
  });
});

describe('security-headers.conf', () => {
  const snippet = readConfig('../../security-headers.conf');

  it.each([
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
  ])('define %s', (header) => {
    expect(snippet).toMatch(new RegExp(`^add_header ${header}\\b`, 'm'));
  });

  /**
   * Sem `always`, o nginx omite o cabeçalho em respostas de erro — justamente
   * as que um atacante consegue provocar com mais facilidade.
   */
  it('marca todos os add_header como always', () => {
    const directives = snippet.match(/^add_header .*$/gm) ?? [];

    expect(directives.length).toBeGreaterThan(0);
    for (const directive of directives) {
      expect(directive.trimEnd()).toMatch(/ always;$/);
    }
  });

  it('não permite curinga na CSP', () => {
    expect(snippet).not.toMatch(/default-src[^;"]*\*/);
    expect(snippet).not.toMatch(/script-src[^;"]*\*/);
  });
});
