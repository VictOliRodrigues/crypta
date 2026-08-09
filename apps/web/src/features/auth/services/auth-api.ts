import {
  type AuthParametersData,
  type AuthSessionData,
  type SetupStatusData,
} from '@crypta/contracts';
import { type Argon2idParameters, type UserKeyBundle } from '@crypta/crypto-core';

import { apiClient, normalizeApiError } from '@/services/api-client';

/**
 * Chamadas de setup e autenticação.
 *
 * Toda falha passa por `normalizeApiError`: a interface consome sempre
 * `ApiRequestError`, e nunca o erro cru do axios, que carrega URL completa e
 * detalhe de infraestrutura.
 *
 * **Nenhuma função aqui recebe a senha.** Elas recebem o `AuthSecret` já
 * derivado; a senha não sai de `identity.ts`.
 */

export async function fetchSetupStatus(): Promise<SetupStatusData> {
  try {
    const response = await apiClient.get<{ data: SetupStatusData }>('/setup/status');

    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function fetchKdfParameters(email: string): Promise<Argon2idParameters> {
  try {
    const response = await apiClient.get<{ data: AuthParametersData }>('/auth/parameters', {
      params: { email },
    });

    const { kdfMemory, kdfIterations, kdfParallelism, kdfSalt } = response.data.data;

    return {
      memoryKib: kdfMemory,
      iterations: kdfIterations,
      parallelism: kdfParallelism,
      salt: kdfSalt,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function createFirstUser(input: {
  name: string;
  email: string;
  authSecret: string;
  keyBundle: UserKeyBundle;
  idempotencyKey: string;
}): Promise<AuthSessionData> {
  try {
    const response = await apiClient.post<{ data: AuthSessionData }>(
      '/setup',
      {
        name: input.name,
        email: input.email,
        authSecret: input.authSecret,
        keyBundle: input.keyBundle,
      },
      { headers: { 'Idempotency-Key': input.idempotencyKey } },
    );

    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function login(input: {
  email: string;
  authSecret: string;
}): Promise<AuthSessionData> {
  try {
    const response = await apiClient.post<{ data: AuthSessionData }>('/auth/login', input);

    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function fetchKeyBundle(): Promise<UserKeyBundle> {
  try {
    const response = await apiClient.get<{ data: UserKeyBundle }>('/users/me/key-bundle');

    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/**
 * `POST /users/me/change-password` (docs/API.md secao 29).
 *
 * O corpo carrega dois `AuthSecret` derivados no cliente e o bundle já
 * reprotegido. A senha, em nenhuma das duas versões, chega aqui.
 */
export async function changePassword(input: {
  currentAuthSecret: string;
  newAuthSecret: string;
  newKeyBundle: UserKeyBundle;
  revokeOtherSessions: boolean;
}): Promise<void> {
  try {
    await apiClient.post('/users/me/change-password', input);
  } catch (error) {
    throw normalizeApiError(error);
  }
}
