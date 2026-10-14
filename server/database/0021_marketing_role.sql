ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('super_admin','admin','marketing','staff','mentor','student') NOT NULL DEFAULT 'student';

ALTER TABLE `app_users`
  MODIFY COLUMN `role` ENUM('super_admin','admin','marketing','staff','mentor','student') NOT NULL DEFAULT 'student';
