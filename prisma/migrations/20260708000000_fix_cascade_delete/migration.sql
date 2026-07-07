-- Fix missing onDelete: Cascade on user_id FKs
-- Blocks user deletion (violates FZ-152 art.21 right to erasure)

-- ProductMessage: drop old FK, add Cascade
ALTER TABLE `product_messages` DROP FOREIGN KEY IF EXISTS `product_messages_user_id_fkey`;
ALTER TABLE `product_messages`
  ADD CONSTRAINT `product_messages_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- LivestreamMessage: drop old FK, add Cascade
ALTER TABLE `livestream_messages` DROP FOREIGN KEY IF EXISTS `livestream_messages_user_id_fkey`;
ALTER TABLE `livestream_messages`
  ADD CONSTRAINT `livestream_messages_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- UserSubscription.user_id: drop old FK, add Cascade
ALTER TABLE `user_subscriptions` DROP FOREIGN KEY IF EXISTS `user_subscriptions_user_id_fkey`;
ALTER TABLE `user_subscriptions`
  ADD CONSTRAINT `user_subscriptions_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- UserSubscription.subscription_id: drop old FK, add Cascade
ALTER TABLE `user_subscriptions` DROP FOREIGN KEY IF EXISTS `user_subscriptions_subscription_id_fkey`;
ALTER TABLE `user_subscriptions`
  ADD CONSTRAINT `user_subscriptions_subscription_id_fkey`
  FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
