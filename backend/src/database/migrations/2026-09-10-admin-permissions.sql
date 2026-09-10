-- Run this once against your existing database (skip it for a brand-new DB
-- created from mailflow.sql, which already includes this column).
ALTER TABLE `users`
  ADD COLUMN `admin_permissions` json DEFAULT NULL AFTER `created_by`;
