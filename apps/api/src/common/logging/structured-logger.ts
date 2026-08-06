import { type LoggerService } from '@nestjs/common';

import { type LogLevel } from '@/config/env.schema';

/**
 * Logger estruturado em JSON (ARCHITECTURE.md secao 34.1, CLAUDE.md secao 36).
 *
 * A classe tem duas faces:
 *
 * - `event()` é a API da aplicação. Aceita apenas campos de um formato fechado
 *   (`LogFields`). Não existe caminho para despejar um objeto arbitrário: uma
 *   entidade inteira logada por engano levaria ciphertext, e-mail ou header de
 *   autorização para o stdout do container.
 *
 * - `log()`, `warn()`, `error()` etc. implementam `LoggerService` para o Nest
 *   usar internamente. Recebem argumentos variádicos e os tratam de forma
 *   defensiva.
 *
 * Campos proibidos, sem exceção: password, authSecret, refreshToken,
 * accessToken, cookie, privateKey, VaultKey, inviteSecret, conteúdo de CSV,
 * usuário da credencial, observação e ciphertext completo.
 */
export type LogFields = {
  /** Verbo do evento em UPPER_SNAKE_CASE, por exemplo `VAULT_CREATED`. */
  action?: string;
  requestId?: string;
  actorUserId?: string;
  vaultId?: string;
  entityId?: string;
  statusCode?: number;
  durationMs?: number;
  /** Nome da classe de erro. Nunca a mensagem crua de uma exceção externa. */
  errorName?: string;
};

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

/** Um contexto do Nest é um nome de classe. Acima disso, não é contexto. */
const MAX_CONTEXT_LENGTH = 64;

export class StructuredLogger implements LoggerService {
  constructor(
    private readonly minimumLevel: LogLevel,
    private readonly defaultContext = 'api',
  ) {}

  withContext(context: string): StructuredLogger {
    return new StructuredLogger(this.minimumLevel, context);
  }

  /** API estruturada usada pelo código da aplicação. */
  event(level: LogLevel, message: string, fields: LogFields = {}): void {
    this.emit(level, message, fields, this.defaultContext);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('info', toMessage(message), {}, this.contextFrom(optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('warn', toMessage(message), {}, this.contextFrom(optionalParams));
  }

  /**
   * O Nest chama `error(message, stack, context)`.
   *
   * Os parâmetros extras são descartados de propósito: em caminho de
   * autenticação ou criptografia o stack costuma conter fragmentos do valor
   * que causou a falha, e não há como distinguir stack de contexto com
   * segurança. O diagnóstico usa o `requestId`.
   */
  error(message: unknown, ..._optionalParams: unknown[]): void {
    this.emit('error', toMessage(message), {}, this.defaultContext);
  }

  fatal(message: unknown, ..._optionalParams: unknown[]): void {
    this.emit('fatal', toMessage(message), {}, this.defaultContext);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('debug', toMessage(message), {}, this.contextFrom(optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('trace', toMessage(message), {}, this.contextFrom(optionalParams));
  }

  private contextFrom(optionalParams: unknown[]): string {
    const last = optionalParams.at(-1);

    if (typeof last === 'string' && last.length > 0 && last.length <= MAX_CONTEXT_LENGTH) {
      return last;
    }

    return this.defaultContext;
  }

  private emit(level: LogLevel, message: string, fields: LogFields, context: string): void {
    if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[this.minimumLevel]) {
      return;
    }

    const entry = {
      level,
      time: new Date().toISOString(),
      context,
      message,
      ...fields,
    };

    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }
}

/**
 * Converte a mensagem em string sem serializar objetos.
 *
 * `JSON.stringify` de um valor desconhecido é exatamente o vazamento que este
 * logger existe para impedir.
 */
function toMessage(message: unknown): string {
  return typeof message === 'string' ? message : '[mensagem não textual omitida]';
}
