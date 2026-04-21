-- AlterTable: add new columns to categories
ALTER TABLE `categories`
  ADD COLUMN `brief_ru`    VARCHAR(191) NULL,
  ADD COLUMN `icon_emoji`  VARCHAR(10)  NULL,
  ADD COLUMN `wave_color`  VARCHAR(50)  NULL,
  ADD COLUMN `wave_accent` VARCHAR(100) NULL,
  ADD COLUMN `parent_id`   VARCHAR(191) NULL,
  ADD COLUMN `sub_type`    VARCHAR(20)  NULL,
  ADD COLUMN `teacher_id`  VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `categories_parent_id_key` ON `categories`(`parent_id`);
CREATE INDEX `categories_teacher_id_key` ON `categories`(`teacher_id`);

-- AddForeignKey: self-referential parent
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_parent_id_fkey`
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: teacher link
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_teacher_id_fkey`
  FOREIGN KEY (`teacher_id`) REFERENCES `profiles`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
