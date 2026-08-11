-- CreateTable
CREATE TABLE `vaults` (
    `id` CHAR(36) NOT NULL,
    `metadata_nonce` VARCHAR(32) NOT NULL,
    `metadata_ciphertext` TEXT NOT NULL,
    `metadata_algorithm` VARCHAR(32) NOT NULL,
    `crypto_version` SMALLINT UNSIGNED NOT NULL,
    `schema_version` SMALLINT UNSIGNED NOT NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `key_version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `vault_members` (
    `id` CHAR(36) NOT NULL,
    `vault_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('OWNER', 'EDITOR') NOT NULL,
    `owner_vault_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vault_members_owner_vault_id_key`(`owner_vault_id`),
    INDEX `vault_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `vault_members_vault_id_user_id_key`(`vault_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `vault_key_envelopes` (
    `id` CHAR(36) NOT NULL,
    `vault_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `key_version` INTEGER UNSIGNED NOT NULL,
    `crypto_version` SMALLINT UNSIGNED NOT NULL,
    `algorithm` VARCHAR(64) NOT NULL,
    `ephemeral_public_key` VARCHAR(43) NOT NULL,
    `encrypted_vault_key` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vault_key_envelopes_user_id_idx`(`user_id`),
    UNIQUE INDEX `vault_key_envelopes_vault_id_user_id_key_version_key`(`vault_id`, `user_id`, `key_version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `actor_id` CHAR(36) NULL,
    `action` VARCHAR(64) NOT NULL,
    `entity_type` VARCHAR(32) NOT NULL,
    `entity_id` CHAR(36) NULL,
    `vault_id` CHAR(36) NULL,
    `request_id` VARCHAR(64) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `result` VARCHAR(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_id_idx`(`actor_id`),
    INDEX `audit_logs_vault_id_idx`(`vault_id`),
    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- AddForeignKey
ALTER TABLE `vault_members` ADD CONSTRAINT `vault_members_vault_id_fkey` FOREIGN KEY (`vault_id`) REFERENCES `vaults`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vault_members` ADD CONSTRAINT `vault_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vault_key_envelopes` ADD CONSTRAINT `vault_key_envelopes_vault_id_fkey` FOREIGN KEY (`vault_id`) REFERENCES `vaults`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vault_key_envelopes` ADD CONSTRAINT `vault_key_envelopes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- `OWNER` único por cofre, garantido pelo banco.
--
-- `owner_vault_id` vale `vault_id` na linha do dono e é nulo nas demais. O
-- índice único que vem do schema recusa o segundo dono do mesmo cofre e ignora
-- os nulos dos EDITORes.
--
-- Quem preenche a coluna são os gatilhos abaixo, e não a aplicação: assim o
-- valor não depende de nenhum caminho de escrita lembrar de calculá-lo.
--
-- As duas formas mais diretas de fazer isso não são possíveis aqui, e as duas
-- falham com erro, não com aviso:
--
--   coluna gerada STORED   -> MySQL 1215: FK com ON DELETE CASCADE não pode
--                             incidir sobre a coluna base de uma coluna gerada
--   CHECK usando vault_id  -> MySQL 3823: coluna necessária à ação referencial
--                             de uma FK não pode aparecer em CHECK
--
-- `vault_id` é justamente a coluna com `ON DELETE CASCADE` exigido pelo ADR
-- 0020. Sobra o gatilho, que reproduz a mesma semântica onde o MySQL permite.
--
-- Prisma não modela gatilho. Eles existem aqui e em DATABASE.md secao 6.1; um
-- drift reportado por `prisma migrate dev` deve ser resolvido preservando-os.
CREATE TRIGGER `vault_members_owner_before_insert`
BEFORE INSERT ON `vault_members`
FOR EACH ROW
  SET NEW.`owner_vault_id` = IF(NEW.`role` = 'OWNER', NEW.`vault_id`, NULL);

CREATE TRIGGER `vault_members_owner_before_update`
BEFORE UPDATE ON `vault_members`
FOR EACH ROW
  SET NEW.`owner_vault_id` = IF(NEW.`role` = 'OWNER', NEW.`vault_id`, NULL);
