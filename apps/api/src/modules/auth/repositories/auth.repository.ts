import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Todo acesso Prisma do módulo de autenticação (CLAUDE.md secao 31).
 *
 * Os selects são mínimos e explícitos. `select: { ... }` em vez do objeto
 * inteiro não é economia de bytes: é o que impede um campo novo e sensível —
 * `auth_secret_hash`, por exemplo — de começar a viajar por uma rota que nunca
 * pediu por ele, só porque foi acrescentado ao model.
 */

/** Cliente ou transação. Permite que o mesmo repositório sirva aos dois. */
export type PrismaExecutor = Prisma.TransactionClient | PrismaService;

export type UserIdentity = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  authSecretHash: string;
  authSecretVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

export type StoredKeyBundle = {
  kdfAlgorithm: string;
  kdfVersion: number;
  kdfSalt: string;
  kdfMemory: number;
  kdfIterations: number;
  kdfParallelism: number;
  publicKey: string;
  encryptedPrivateKey: string;
  privateKeyNonce: string;
  cryptoVersion: number;
  schemaVersion: number;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Existe algum usuário?
   *
   * `findFirst` com `select: { id }` em vez de `count`: a resposta é booleana e
   * a contagem exata não pode escapar por `GET /setup/status` (docs/API.md
   * secao 19). Não contar é mais barato e remove a tentação.
   */
  async hasAnyUser(executor: PrismaExecutor = this.prisma): Promise<boolean> {
    const user = await executor.user.findFirst({ select: { id: true } });

    return user !== null;
  }

  async findIdentityByEmail(
    email: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<UserIdentity | null> {
    return executor.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        authSecretHash: true,
        authSecretVersion: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });
  }

  async findKdfParametersByEmail(
    email: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<Pick<
    StoredKeyBundle,
    'kdfAlgorithm' | 'kdfVersion' | 'kdfSalt' | 'kdfMemory' | 'kdfIterations' | 'kdfParallelism'
  > | null> {
    const bundle = await executor.userKeyBundle.findFirst({
      where: { user: { email } },
      select: {
        kdfAlgorithm: true,
        kdfVersion: true,
        kdfSalt: true,
        kdfMemory: true,
        kdfIterations: true,
        kdfParallelism: true,
      },
    });

    return bundle;
  }

  async createUserWithKeyBundle(
    input: {
      name: string;
      email: string;
      authSecretHash: string;
      authSecretVersion: number;
      keyBundle: StoredKeyBundle;
    },
    executor: PrismaExecutor,
  ): Promise<{ id: string; name: string; email: string }> {
    return executor.user.create({
      data: {
        name: input.name,
        email: input.email,
        authSecretHash: input.authSecretHash,
        authSecretVersion: input.authSecretVersion,
        keyBundle: { create: input.keyBundle },
      },
      select: { id: true, name: true, email: true },
    });
  }

  async findKeyBundleByUserId(
    userId: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<StoredKeyBundle | null> {
    return executor.userKeyBundle.findUnique({
      where: { userId },
      select: {
        kdfAlgorithm: true,
        kdfVersion: true,
        kdfSalt: true,
        kdfMemory: true,
        kdfIterations: true,
        kdfParallelism: true,
        publicKey: true,
        encryptedPrivateKey: true,
        privateKeyNonce: true,
        cryptoVersion: true,
        schemaVersion: true,
      },
    });
  }

  async findUserById(
    id: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<{ id: string; name: string; email: string } | null> {
    return executor.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }

  async findIdentityById(
    id: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<UserIdentity | null> {
    return executor.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        authSecretHash: true,
        authSecretVersion: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });
  }

  /**
   * Troca verificador e key bundle na mesma transação (docs/API.md secao 29).
   *
   * Os dois lados são um par: o verificador prova a senha nova, e o bundle é
   * legível pela `UserEncryptionKey` que essa mesma senha deriva. Gravar um sem
   * o outro produz uma conta que autentica e não abre, ou que abre e não
   * autentica — nos dois casos sem caminho de volta, porque a senha antiga já
   * não vale para metade do par.
   *
   * O `executor` é obrigatório aqui, ao contrário dos leitores acima: não existe
   * uso legítimo desta escrita fora de uma transação.
   */
  async replaceCredential(
    input: {
      userId: string;
      authSecretHash: string;
      authSecretVersion: number;
      keyBundle: StoredKeyBundle;
    },
    executor: PrismaExecutor,
  ): Promise<void> {
    await executor.user.update({
      where: { id: input.userId },
      data: {
        authSecretHash: input.authSecretHash,
        authSecretVersion: input.authSecretVersion,
        // A troca de senha bem-sucedida encerra qualquer bloqueio em curso: quem
        // apresentou a credencial atual provou ser o dono, e manter a contagem
        // puniria a vítima de um ataque que ela acabou de responder.
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true },
    });

    await executor.userKeyBundle.update({
      where: { userId: input.userId },
      data: input.keyBundle,
      select: { userId: true },
    });
  }
}
