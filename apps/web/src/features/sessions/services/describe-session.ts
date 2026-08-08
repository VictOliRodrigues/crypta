import { type SessionView } from '@crypta/contracts';

/**
 * Descrição legível de uma sessão, para o W24 (TELAS.md secao 29).
 *
 * A tela pede dispositivo, navegador e sistema operacional; a API guarda o
 * `User-Agent` cru, porque é o que o cliente mandou e o servidor não deve
 * interpretar em nome de ninguém. A tradução acontece aqui.
 *
 * **É formatação, nunca decisão.** Nenhum valor produzido aqui participa de
 * autorização, e todos vêm do cliente — quem forja o header escolhe o texto
 * exibido. O objetivo é apenas permitir ao dono reconhecer o próprio acesso.
 *
 * Não há dependência de parser de `User-Agent`: a lista abaixo cobre os
 * navegadores que o produto suporta e cai para "Desconhecido" no resto, o que é
 * honesto. Uma biblioteca traria uma base de milhares de assinaturas e
 * atualizações constantes para um rótulo de tela (`CLAUDE.md` secao 59).
 */

/**
 * Ordem importa: os tokens depois são substring dos anteriores no `User-Agent`
 * real. Chrome traz `Safari`, Edge traz `Chrome` e `Safari`, Opera traz os três.
 */
const BROWSERS: ReadonlyArray<readonly [token: string, label: string]> = [
  ['Edg/', 'Edge'],
  ['OPR/', 'Opera'],
  ['Firefox/', 'Firefox'],
  ['Chrome/', 'Chrome'],
  ['Safari/', 'Safari'],
];

/** `Android` antes de `Linux` porque todo Android também se declara Linux. */
const OPERATING_SYSTEMS: ReadonlyArray<readonly [token: string, label: string]> = [
  ['Windows', 'Windows'],
  ['Android', 'Android'],
  ['iPhone', 'iOS'],
  ['iPad', 'iPadOS'],
  ['Mac OS X', 'macOS'],
  ['Linux', 'Linux'],
];

const UNKNOWN = 'Desconhecido';

function matchToken(
  userAgent: string,
  table: ReadonlyArray<readonly [string, string]>,
): string | null {
  for (const [token, label] of table) {
    if (userAgent.includes(token)) {
      return label;
    }
  }

  return null;
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  web: 'Navegador',
  android: 'Android',
  extension: 'Extensão',
};

export type SessionDescription = {
  /** Rótulo principal da linha. */
  device: string;
  browser: string;
  operatingSystem: string;
};

export function describeSession(session: SessionView): SessionDescription {
  const userAgent = session.userAgent ?? '';
  const browser = matchToken(userAgent, BROWSERS) ?? UNKNOWN;
  const operatingSystem = matchToken(userAgent, OPERATING_SYSTEMS) ?? UNKNOWN;

  return { device: deviceLabel(session, browser, operatingSystem), browser, operatingSystem };
}

/**
 * Nome do dispositivo, na melhor forma disponível.
 *
 * `clientName` vem do header `X-Client-Name` e ganha quando existe: é o único
 * valor que o usuário pode ter escolhido. Sem ele, "Chrome no Windows" é
 * reconhecível; sem nada, o tipo de cliente ainda diz mais que um traço.
 */
function deviceLabel(session: SessionView, browser: string, operatingSystem: string): string {
  if (session.clientName !== null && session.clientName.length > 0) {
    return session.clientName;
  }

  if (browser !== UNKNOWN && operatingSystem !== UNKNOWN) {
    return `${browser} no ${operatingSystem}`;
  }

  return CLIENT_TYPE_LABELS[session.clientType] ?? UNKNOWN;
}

/**
 * Data e hora no fuso do navegador.
 *
 * A API entrega ISO 8601 em UTC. Exibir o valor cru faria o usuário comparar um
 * horário que não é o do relógio dele para decidir se reconhece o acesso.
 */
export function formatSessionMoment(isoTimestamp: string): string {
  const moment = new Date(isoTimestamp);

  if (Number.isNaN(moment.getTime())) {
    return UNKNOWN;
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    moment,
  );
}

/** IP ausente é exibido como ausente, e não como string vazia na tabela. */
export function formatIpAddress(ipAddress: string | null): string {
  return ipAddress === null || ipAddress.length === 0 ? 'Não registrado' : ipAddress;
}
