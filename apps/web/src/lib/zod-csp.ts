import { config } from 'zod';

/**
 * Desliga o JIT do Zod nesta aplicação.
 *
 * ## Por que
 *
 * O Zod 4 compila validadores com o construtor `Function` para ganhar
 * velocidade, e decide se pode fazê-lo por uma sonda:
 *
 * ```ts
 * try { const F = Function; new F(''); return true } catch { return false }
 * ```
 *
 * Sob a nossa CSP — `script-src 'self' 'wasm-unsafe-eval'`, sem
 * `'unsafe-eval'` — a sonda lança, o Zod captura e cai no caminho
 * interpretado. **Funciona.** Mas o navegador registra a tentativa como
 * violação de CSP antes de o `catch` acontecer, e o erro aparece no console.
 *
 * ## Por que isso importa num cofre de senhas
 *
 * Um erro vermelho de Content-Security-Policy na tela de login de um produto de
 * segurança é indistinguível, para quem olha, de um ataque de injeção em curso.
 * Já custou uma investigação inteira aqui: o erro foi perseguido como causa de
 * uma falha de login que não tinha relação nenhuma com ele.
 *
 * `jitless` faz o Zod pular a sonda — é o motivo pelo qual a opção existe, e o
 * comentário no código do próprio Zod diz isso. O custo é validação
 * interpretada, irrelevante para formulários de dezenas de campos.
 *
 * Vale só para a Web. A API não tem CSP e se beneficia do JIT.
 *
 * Precisa ser executado **antes** de qualquer schema ser usado, por isso é
 * importado no topo de `main.tsx`.
 */
config({ jitless: true });
