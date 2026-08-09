import { describe, expect, it } from 'vitest';
import { config, z } from 'zod';

import mainSource from '../main.tsx?raw';

import './zod-csp';

/**
 * O JIT do Zod desligado, e o efeito que isso tem sob a nossa CSP.
 *
 * O que se protege aqui é uma propriedade fácil de perder sem perceber: basta
 * alguém remover o import de `zod-csp` no `main.tsx`, ou o Zod mudar o nome da
 * opção numa atualização, para a violação de CSP voltar à tela de login — e ela
 * não quebra nada, então nenhum outro teste reprovaria.
 */

describe('configuração do Zod para CSP', () => {
  /**
   * A asserção que importa: `jitless` ligado é o que faz o Zod **pular** a sonda
   * `new Function('')`, e é a sonda que o navegador reporta como violação.
   */
  it('deixa o Zod em modo jitless', () => {
    expect(config().jitless).toBe(true);
  });

  // Não há caso reproduzindo a sonda `new Function('')`: o `no-implied-eval` do
  // eslint a reprova, e abrir exceção para ela num produto de segurança custaria
  // mais do que o teste provaria.

  /**
   * A ordem do import em `main.tsx` é carga funcional, e nada além deste teste a
   * protege.
   *
   * O Zod decide se usa o JIT **ao construir cada schema**, e `app-router` puxa
   * telas que constroem schemas no escopo do módulo. Se `zod-csp` for importado
   * depois delas, a configuração chega tarde: tudo continua funcionando, a
   * validação continua correta, e a violação de CSP volta calada à tela de
   * login. Nenhum outro teste reprovaria.
   */
  it('é o primeiro import de main.tsx', () => {
    const firstImport = /^import .*$/m.exec(mainSource);

    expect(firstImport?.[0]).toBe("import '@/lib/zod-csp';");
  });

  it('valida corretamente com o JIT desligado', () => {
    const schema = z.object({
      email: z.email(),
      password: z.string().min(12),
    });

    expect(
      schema.safeParse({ email: 'alice@example.test', password: 'senha-comprida' }).success,
    ).toBe(true);
    expect(schema.safeParse({ email: 'nao-e-email', password: 'curta' }).success).toBe(false);
  });

  it('preserva as mensagens de erro por campo', () => {
    const schema = z.object({ email: z.email({ message: 'E-mail inválido.' }) });
    const result = schema.safeParse({ email: 'x' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('E-mail inválido.');
  });
});
