-- Migration de identidade (BLG-0502). Primeira migration do projeto.
--
-- REVISADA À MÃO em um ponto: o Prisma emite
-- `COLLATE utf8mb4_unicode_ci` em toda tabela MySQL, e não há como declarar
-- outra collation no `schema.prisma`. A `DATABASE.md` secao 3 exige
-- `utf8mb4_0900_ai_ci`, que é a default do MySQL 8 e a do servidor. Misturar as
-- duas produz "Illegal mix of collations" em qualquer join futuro entre uma
-- tabela desta migration e uma da próxima.
--
-- Toda migration seguinte precisa da mesma correção, e da mesma revisão.

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `auth_secret_hash` CHAR(64) NOT NULL,
    `auth_secret_version` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `failed_login_attempts` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `user_key_bundles` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `kdf_algorithm` VARCHAR(32) NOT NULL,
    `kdf_version` SMALLINT UNSIGNED NOT NULL,
    `kdf_salt` VARCHAR(32) NOT NULL,
    `kdf_memory` INTEGER UNSIGNED NOT NULL,
    `kdf_iterations` SMALLINT UNSIGNED NOT NULL,
    `kdf_parallelism` SMALLINT UNSIGNED NOT NULL,
    `public_key` VARCHAR(43) NOT NULL,
    `encrypted_private_key` VARCHAR(255) NOT NULL,
    `private_key_nonce` VARCHAR(32) NOT NULL,
    `crypto_version` SMALLINT UNSIGNED NOT NULL,
    `schema_version` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_key_bundles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `family_id` CHAR(36) NOT NULL,
    `refresh_token_hash` CHAR(64) NOT NULL,
    `previous_token_hash` CHAR(64) NULL,
    `rotated_at` DATETIME(3) NULL,
    `client_type` VARCHAR(16) NOT NULL,
    `client_name` VARCHAR(120) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_refresh_token_hash_key`(`refresh_token_hash`),
    INDEX `sessions_user_id_idx`(`user_id`),
    INDEX `sessions_family_id_idx`(`family_id`),
    INDEX `sessions_previous_token_hash_idx`(`previous_token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `idempotency_records` (
    `id` CHAR(36) NOT NULL,
    `scope` VARCHAR(64) NOT NULL,
    `idempotency_key` VARCHAR(255) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `resource_id` CHAR(36) NULL,
    `response_status` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `idempotency_records_scope_idempotency_key_key`(`scope`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- AddForeignKey
ALTER TABLE `user_key_bundles` ADD CONSTRAINT `user_key_bundles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
