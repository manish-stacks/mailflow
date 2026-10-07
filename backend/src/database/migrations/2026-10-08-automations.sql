-- Run once on an existing database (new installs: append to mailflow.sql).
CREATE TABLE IF NOT EXISTS `automations` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `trigger_type` enum('list_join','contact_created') NOT NULL DEFAULT 'list_join',
  `list_id` char(36) DEFAULT NULL,
  `sender_identity_id` char(36) DEFAULT NULL,
  `status` enum('draft','active','paused') NOT NULL DEFAULT 'draft',
  `activated_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_auto_ws_status` (`workspace_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_steps` (
  `id` char(36) NOT NULL,
  `automation_id` char(36) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `delay_minutes` int(11) NOT NULL DEFAULT 0,
  `subject` varchar(255) NOT NULL,
  `preview_text` varchar(255) DEFAULT NULL,
  `html_content` mediumtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_as_auto` (`automation_id`,`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_enrollments` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `automation_id` char(36) NOT NULL,
  `contact_id` char(36) NOT NULL,
  `next_step` int(11) NOT NULL DEFAULT 0,
  `next_run_at` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
  `sent_count` int(11) NOT NULL DEFAULT 0,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `last_error` varchar(480) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ae_auto_contact` (`automation_id`,`contact_id`),
  KEY `idx_ae_due` (`status`,`next_run_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
