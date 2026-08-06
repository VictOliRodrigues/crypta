import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type ReadinessData, type VersionData } from '@vault/contracts';

import { ApiRequestError } from '@/services/api-client';

import { fetchApiReadiness, fetchApiVersion } from '../services/diagnostics-api';
import { StatusPage } from './status-page';

vi.mock('../services/diagnostics-api', () => ({
  fetchApiVersion: vi.fn(),
  fetchApiReadiness: vi.fn(),
}));

const versionMock = vi.mocked(fetchApiVersion);
const readinessMock = vi.mocked(fetchApiReadiness);

const API_VERSION: VersionData = {
  service: 'vault-api',
  version: '0.1.0',
  commit: 'abc1234',
  environment: 'development',
  builtAt: '2026-08-05T00:00:00.000Z',
};

const READY: ReadinessData = { status: 'ready', database: 'ok' };

function renderPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StatusPage />
    </QueryClientProvider>,
  );
}

describe('StatusPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows the build metadata of the web application without calling the API', () => {
    versionMock.mockReturnValue(new Promise(() => undefined));
    readinessMock.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByText('0.0.0-test')).toBeInTheDocument();
    expect(screen.getByText('testcommit')).toBeInTheDocument();
  });

  it('reports the API version, commit and database once the API answers', async () => {
    versionMock.mockResolvedValue(API_VERSION);
    readinessMock.mockResolvedValue(READY);

    renderPage();

    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
    expect(await screen.findByText('abc1234')).toBeInTheDocument();
    expect(await screen.findByText('conectado')).toBeInTheDocument();
  });

  it('marks the database as unavailable when readiness fails', async () => {
    versionMock.mockResolvedValue(API_VERSION);
    readinessMock.mockRejectedValue(
      new ApiRequestError(
        'SERVICE_UNAVAILABLE',
        'O serviço ainda não está disponível.',
        '018f0000-0000-7000-8000-000000000999',
        503,
      ),
    );

    renderPage();

    expect(await screen.findByText('indisponível')).toBeInTheDocument();
  });

  it('shows the requestId in the error alert so it can be matched with the server log', async () => {
    versionMock.mockResolvedValue(API_VERSION);
    readinessMock.mockRejectedValue(
      new ApiRequestError(
        'SERVICE_UNAVAILABLE',
        'O serviço ainda não está disponível.',
        'req-123',
        503,
      ),
    );

    renderPage();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('req-123');
  });

  it('warns when the web build and the API report different environments', async () => {
    versionMock.mockResolvedValue({ ...API_VERSION, environment: 'production' });
    readinessMock.mockResolvedValue(READY);

    renderPage();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('production');
  });

  it('does not warn when both environments match', async () => {
    versionMock.mockResolvedValue(API_VERSION);
    readinessMock.mockResolvedValue(READY);

    renderPage();

    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
