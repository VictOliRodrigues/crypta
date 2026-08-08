import { HttpStatus, type PipeTransform } from '@nestjs/common';
import { type ZodType } from 'zod';

import { type ApiErrorDetail } from '@crypta/contracts';

import { ApiException } from '@/common/errors/api.exception';

/**
 * Validação de entrada por schema Zod.
 *
 * A alternativa seria DTO com decorators de `class-validator`, que é o padrão do
 * Nest. Zod foi escolhido porque `@crypta/validation` já é Zod e é consumido
 * pelos formulários da Web: com o mesmo schema nos dois lados, um campo aceito
 * pela API e recusado pelo formulário — ou o contrário — deixa de ser possível.
 * Dois conjuntos de regras equivalentes divergem no primeiro ajuste.
 *
 * O `ValidationPipe` global continua montado para DTOs de classe. Ele ignora
 * parâmetros tipados como tipo puro, cujo `metatype` é `Object`, então os dois
 * convivem sem que um anule o outro.
 *
 * Campo desconhecido é responsabilidade do schema: use `.strict()` onde a
 * tolerância seria perigosa. É o que impede um `privateKey` em texto aberto de
 * ser aceito e descartado em silêncio — a API precisa **recusar**.
 */
export class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    // O `path` identifica o campo e a mensagem já vem em português do schema.
    // O valor recebido nunca entra no detalhe: ele pode ser o `authSecret`.
    const details: ApiErrorDetail[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      code: issue.code.toUpperCase(),
      message: issue.message,
    }));

    throw new ApiException(
      'VALIDATION_ERROR',
      HttpStatus.BAD_REQUEST,
      'Alguns campos estão inválidos.',
      details,
    );
  }
}
