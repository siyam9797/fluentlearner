ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('user','super_admin','admin','staff','mentor','student') NOT NULL DEFAULT 'student';

UPDATE `users` SET `role` = 'student' WHERE `role` = 'user';

ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('super_admin','admin','staff','mentor','student') NOT NULL DEFAULT 'student';

ALTER TABLE `app_users`
  MODIFY COLUMN `role` ENUM('super_admin','admin','staff','mentor','student') NOT NULL DEFAULT 'student';
