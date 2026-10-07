-- Open/click tracking for automations. Run once after 2026-10-08-automations.sql.
CREATE TABLE IF NOT EXISTS `automation_events` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `automation_id` char(36) NOT NULL,
  `enrollment_id` char(36) NOT NULL,
  `contact_id` char(36) NOT NULL,
  `step_position` int(11) NOT NULL DEFAULT 0,
  `event_type` enum('opened','clicked') NOT NULL,
  `url` varchar(2048) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_aev_auto` (`automation_id`,`event_type`,`step_position`),
  KEY `idx_aev_enroll` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
