import { type Request } from 'express';

import { CLIENT_TYPES, type ClientType, REQUEST_HEADERS } from '@crypta/contracts';

import { type SessionClient } from '../services/session-issuer.service';

/**
 * Metadados de cliente que a sessão guarda, extraídos da requisição.
 *
 * São exibidos na tela de sessões para que o usuário reconheça o que revogar.
 * Nenhum deles é confiável — todos vêm do cliente — e por isso nenhum participa
 * de decisão de autorização.
 */

/** Truncados no tamanho da coluna. Um header longo não pode derrubar o insert. */
const MAX_CLIENT_NAME = 120;
const MAX_USER_AGENT = 255;
const MAX_IP = 45;

function truncate(value: string | undefined, max: number): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed.slice(0, max);
}

function readHeader(request: Request, name: string): string | undefined {
  const value = request.headers[name];

  return typeof value === 'string' ? value : undefined;
}

function readClientType(request: Request): ClientType {
  const declared = readHeader(request, REQUEST_HEADERS.clientType);

  // Um tipo desconhecido vira `web` em vez de erro: o campo é informativo, e
  // recusar a autenticação por causa dele seria desproporcional.
  return CLIENT_TYPES.includes(declared as ClientType) ? (declared as ClientType) : 'web';
}

export function readSessionClient(request: Request): SessionClient {
  return {
    type: readClientType(request),
    name: truncate(readHeader(request, 'x-client-name'), MAX_CLIENT_NAME),
    ipAddress: truncate(request.ip, MAX_IP),
    userAgent: truncate(readHeader(request, 'user-agent'), MAX_USER_AGENT),
  };
}
