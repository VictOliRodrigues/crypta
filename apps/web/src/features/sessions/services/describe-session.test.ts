import { describe, expect, it } from 'vitest';

import { type SessionView } from '@crypta/contracts';

import { describeSession, formatIpAddress, formatSessionMoment } from './describe-session';

/**
 * Rótulos do W24.
 *
 * O que estes testes protegem é a ordem das tabelas de tokens: todo Chrome se
 * declara Safari, todo Edge se declara Chrome, e todo Android se declara Linux.
 * Uma tabela na ordem errada mostra "Safari no Linux" para quem está no Edge em
 * Android, e o usuário deixa de reconhecer a própria sessão.
 */

const BASE: SessionView = {
  id: '0198f0c2-0000-7000-8000-000000000001',
  clientType: 'web',
  clientName: null,
  ipAddress: '192.0.2.10',
  userAgent: null,
  createdAt: '2026-08-08T12:00:00.000Z',
  lastUsedAt: '2026-08-08T15:30:00.000Z',
  isCurrent: false,
};

function withUserAgent(userAgent: string): SessionView {
  return { ...BASE, userAgent };
}

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const EDGE_WINDOWS = `${CHROME_WINDOWS} Edg/140.0.0.0`;
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0';
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

describe('describeSession', () => {
  it('reconhece Chrome no Windows', () => {
    const description = describeSession(withUserAgent(CHROME_WINDOWS));

    expect(description.browser).toBe('Chrome');
    expect(description.operatingSystem).toBe('Windows');
  });

  it('reconhece Edge sem confundir com o Chrome que ele declara ser', () => {
    expect(describeSession(withUserAgent(EDGE_WINDOWS)).browser).toBe('Edge');
  });

  it('reconhece Firefox no Linux', () => {
    const description = describeSession(withUserAgent(FIREFOX_LINUX));

    expect(description.browser).toBe('Firefox');
    expect(description.operatingSystem).toBe('Linux');
  });

  it('reconhece Safari no macOS', () => {
    const description = describeSession(withUserAgent(SAFARI_MAC));

    expect(description.browser).toBe('Safari');
    expect(description.operatingSystem).toBe('macOS');
  });

  it('reconhece Android sem cair no Linux que todo Android declara', () => {
    const description = describeSession(withUserAgent(CHROME_ANDROID));

    expect(description.browser).toBe('Chrome');
    expect(description.operatingSystem).toBe('Android');
  });

  it('reconhece iOS', () => {
    expect(describeSession(withUserAgent(SAFARI_IPHONE)).operatingSystem).toBe('iOS');
  });

  it('monta o dispositivo a partir de navegador e sistema', () => {
    expect(describeSession(withUserAgent(CHROME_WINDOWS)).device).toBe('Chrome no Windows');
  });

  it('prefere o clientName quando o cliente informou um', () => {
    const session = { ...withUserAgent(CHROME_WINDOWS), clientName: 'Notebook do trabalho' };

    expect(describeSession(session).device).toBe('Notebook do trabalho');
  });

  it('cai para o tipo de cliente quando não há User-Agent reconhecível', () => {
    const description = describeSession(BASE);

    expect(description.browser).toBe('Desconhecido');
    expect(description.operatingSystem).toBe('Desconhecido');
    expect(description.device).toBe('Navegador');
  });

  it('não inventa navegador para um User-Agent que não conhece', () => {
    expect(describeSession(withUserAgent('curl/8.7.1')).browser).toBe('Desconhecido');
  });
});

describe('formatSessionMoment', () => {
  it('converte o ISO em data e hora legíveis', () => {
    // Sem asserção sobre o fuso: o valor exibido é o do relógio de quem olha, e
    // fixar um horário aqui tornaria o teste dependente do TZ da máquina.
    expect(formatSessionMoment('2026-08-08T15:30:00.000Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });

  it('não quebra a tabela com um timestamp inválido', () => {
    expect(formatSessionMoment('nao-e-uma-data')).toBe('Desconhecido');
  });
});

describe('formatIpAddress', () => {
  it('devolve o endereço quando existe', () => {
    expect(formatIpAddress('192.0.2.10')).toBe('192.0.2.10');
  });

  it('diz que não há registro em vez de deixar a célula vazia', () => {
    expect(formatIpAddress(null)).toBe('Não registrado');
  });
});
