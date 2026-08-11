import { createBrowserRouter, RouterProvider } from 'react-router';

import { routes } from './routes';

/**
 * O grafo de rotas vive em `routes.tsx`, separado deste arquivo.
 *
 * Dois motivos: um teste precisa montá-lo com `useRoutes`, porque o data router
 * do React Router não navega sob jsdom; e o fast refresh só funciona quando um
 * módulo exporta apenas componentes.
 */
const router = createBrowserRouter(routes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
