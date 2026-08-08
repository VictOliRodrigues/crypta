import { Injectable } from '@nestjs/common';

import { type SetupStatusData } from '@crypta/contracts';

import { AuthRepository } from '../repositories/auth.repository';

/**
 * `GET /setup/status` (docs/API.md secao 19).
 *
 * Devolve apenas um booleano. Quantidade de usuários, data de criação ou
 * qualquer detalhe interno ficam de fora — a rota é pública, e a única coisa que
 * ela precisa responder é se a tela W01 deve aparecer.
 */
@Injectable()
export class SetupStatusService {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<SetupStatusData> {
    return { setupRequired: !(await this.repository.hasAnyUser()) };
  }
}
