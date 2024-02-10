-- CreateTable
CREATE TABLE `Crawl` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `type` ENUM('ACADEMIC') NOT NULL,
    `url` VARCHAR(300) NOT NULL,
    `crawled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notice_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Crawl` ADD CONSTRAINT `Crawl_notice_id_fkey` FOREIGN KEY (`notice_id`) REFERENCES `Notice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;