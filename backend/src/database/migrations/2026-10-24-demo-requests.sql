-- Landing-page "Get a free demo" requests. Run once.
CREATE TABLE IF NOT EXISTS `demo_requests` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `company` varchar(200) DEFAULT NULL,
  `team_size` varchar(30) DEFAULT NULL,
  `interests` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`interests`)),
  `message` text DEFAULT NULL,
  `source` varchar(60) NOT NULL DEFAULT 'landing',
  `status` enum('new','contacted','scheduled','completed','spam') NOT NULL DEFAULT 'new',
  `notes` text DEFAULT NULL,
  `consent` tinyint(1) NOT NULL DEFAULT 1,
  `ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `contacted_at` datetime DEFAULT NULL,
  `handled_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_demo_status_created` (`status`,`created_at`),
  KEY `idx_demo_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
