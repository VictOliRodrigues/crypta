import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type Response } from 'express';

import { type ApiErrorCode, type ApiErrorDetail, type ApiErrorResponse } from '@crypta/contracts';

import { ApiException } from '@/common/errors/api.exception';
import { getRequestId, type RequestWithId } from '@/common/http/request-id.middleware';
import { StructuredLogger } from '@/common/logging/structured-logger';

type DescribedError = {
  status: number;
  code: ApiErrorCode;
  message: string;
  details: ApiErrorDetail[];
};

/**
 * Mensagens públicas por status.
 *
 * São genéricas de propósito. Repassar a mensagem original do Nest ou de uma
 * biblioteca vazaria nome de campo interno, caminho de arquivo ou trecho de
 * query (docs/API.md secao 8).
 */
const STATUS_FALLBACK: Record<number, { code: ApiErrorCode; message: string }> = {
  [HttpStatus.BAD_REQUEST]: { code: 'INVALID_REQUEST', message: 'Requisição inválida.' },
  [HttpStatus.UNAUTHORIZED]: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' },
  [HttpStatus.FORBIDDEN]: {
    code: 'ACCESS_DENIED',
    message: 'Você não possui permissão para esta ação.',
  },
  [HttpStatus.NOT_FOUND]: { code: 'RESOURCE_NOT_FOUND', message: 'Recurso não encontrado.' },
  [HttpStatus.CONFLICT]: {
    code: 'VERSION_CONFLICT',
    message: 'O registro foi alterado por outro usuário.',
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Conteúdo maior que o permitido.',
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    code: 'VALIDATION_ERROR',
    message: 'Verifique os campos informados.',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Muitas tentativas. Tente novamente mais tarde.',
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'O serviço ainda não está disponível.',
  },
};

const INTERNAL_ERROR: DescribedError = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Não foi possível concluir a operação.',
  details: [],
};

/**
 * Converte qualquer exceção no envelope de erro padrão.
 *
 * Nenhuma resposta contém stack trace, query, path interno ou detalhe de
 * infraestrutura. Toda falha inesperada vira `500 INTERNAL_ERROR` com
 * mensagem genérica; o diagnóstico acontece pelo `requestId` nos logs.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<RequestWithId>();
    const response = httpContext.getResponse<Response>();

    const requestId = getRequestId(request);
    const described = this.describe(exception);

    this.logger.event('error', 'request_failed', {
      requestId,
      statusCode: described.status,
      errorName: exception instanceof Error ? exception.name : 'UnknownError',
    });

    const body: ApiErrorResponse = {
      error: {
        code: described.code,
        message: described.message,
        requestId,
        details: described.details,
      },
    };

    response.status(described.status).json(body);
  }

  private describe(exception: unknown): DescribedError {
    if (exception instanceof ApiException) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.publicMessage,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const fallback = STATUS_FALLBACK[status];

      if (fallback === undefined) {
        return { ...INTERNAL_ERROR, status };
      }

      return { status, code: fallback.code, message: fallback.message, details: [] };
    }

    return INTERNAL_ERROR;
  }
}
