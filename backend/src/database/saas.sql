-- MailFlow — SaaS layer: plans, subscriptions, usage metering,
-- per-workspace mail connections, platform super-admin.
-- FIXED VERSION
-- Run AFTER schema.sql.
--
-- IMPORTANT:
-- This version does NOT hard-code workspace_id CHAR(36) for foreign keys.
-- It creates the tables first, reads the actual workspaces.id / plans.id
-- definitions, then changes the FK columns to match and adds the constraints.
-- This prevents MySQL errno: 150 caused by mismatched FK column types.

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------- plans
CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(60) NOT NULL,
  description VARCHAR(500) NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',

  max_contacts INT NOT NULL DEFAULT 1000,
  max_emails_per_month INT NOT NULL DEFAULT 5000,
  max_campaigns_per_month INT NOT NULL DEFAULT -1,
  max_team_members INT NOT NULL DEFAULT 2,
  max_sender_identities INT NOT NULL DEFAULT 1,
  max_domains INT NOT NULL DEFAULT 1,
  ai_credits_per_day INT NOT NULL DEFAULT 20,

  allow_custom_smtp TINYINT(1) NOT NULL DEFAULT 0,
  allow_api_access TINYINT(1) NOT NULL DEFAULT 0,
  allow_ai TINYINT(1) NOT NULL DEFAULT 1,
  allow_segments TINYINT(1) NOT NULL DEFAULT 1,
  remove_branding TINYINT(1) NOT NULL DEFAULT 0,

  is_public TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plan_slug (slug),
  KEY idx_plan_public (is_public, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------- subscriptions
-- Create WITHOUT FKs first. FKs are added after matching actual parent types.
CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  status ENUM('trialing','active','past_due','cancelled','suspended') NOT NULL DEFAULT 'active',
  billing_cycle ENUM('monthly','yearly','lifetime','free') NOT NULL DEFAULT 'monthly',
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NULL,
  trial_ends_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  overrides JSON NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sub_workspace (workspace_id),
  KEY idx_sub_plan (plan_id),
  KEY idx_sub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------- usage metering
CREATE TABLE IF NOT EXISTS usage_periods (
  id CHAR(36) NOT NULL PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL,
  period CHAR(7) NOT NULL,
  emails_sent INT NOT NULL DEFAULT 0,
  campaigns_created INT NOT NULL DEFAULT 0,
  contacts_imported INT NOT NULL DEFAULT 0,
  ai_calls INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usage_ws_period (workspace_id, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------- per-workspace mail connection
CREATE TABLE IF NOT EXISTS email_connections (
  id CHAR(36) NOT NULL PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL,
  label VARCHAR(120) NOT NULL DEFAULT 'Primary',
  provider ENUM('smtp','gmail','outlook','ses','brevo','sendgrid','mailgun') NOT NULL DEFAULT 'smtp',
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL DEFAULT 587,
  secure TINYINT(1) NOT NULL DEFAULT 0,
  username VARCHAR(255) NULL,
  password_enc TEXT NULL,
  from_name VARCHAR(150) NULL,
  from_email VARCHAR(255) NULL,
  daily_limit INT NOT NULL DEFAULT 0,
  rate_per_minute INT NOT NULL DEFAULT 0,
  status ENUM('untested','verified','failed') NOT NULL DEFAULT 'untested',
  last_error VARCHAR(500) NULL,
  last_tested_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mailconn_ws (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Match subscriptions.workspace_id to workspaces.id
-- ============================================================

SET @ws_type = (
  SELECT COLUMN_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workspaces'
    AND COLUMN_NAME = 'id'
  LIMIT 1
);

SET @ws_charset = (
  SELECT CHARACTER_SET_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workspaces'
    AND COLUMN_NAME = 'id'
  LIMIT 1
);

SET @ws_collation = (
  SELECT COLLATION_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workspaces'
    AND COLUMN_NAME = 'id'
  LIMIT 1
);

SET @sql = CONCAT(
  'ALTER TABLE subscriptions MODIFY workspace_id ', @ws_type, ' NOT NULL',
  IF(@ws_charset IS NOT NULL, CONCAT(' CHARACTER SET ', @ws_charset), ''),
  IF(@ws_collation IS NOT NULL, CONCAT(' COLLATE ', @ws_collation), '')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT(
  'ALTER TABLE usage_periods MODIFY workspace_id ', @ws_type, ' NOT NULL',
  IF(@ws_charset IS NOT NULL, CONCAT(' CHARACTER SET ', @ws_charset), ''),
  IF(@ws_collation IS NOT NULL, CONCAT(' COLLATE ', @ws_collation), '')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT(
  'ALTER TABLE email_connections MODIFY workspace_id ', @ws_type, ' NOT NULL',
  IF(@ws_charset IS NOT NULL, CONCAT(' CHARACTER SET ', @ws_charset), ''),
  IF(@ws_collation IS NOT NULL, CONCAT(' COLLATE ', @ws_collation), '')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Match plan_id to plans.id
-- ============================================================

SET @plan_type = (
  SELECT COLUMN_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'plans'
    AND COLUMN_NAME = 'id'
  LIMIT 1
);

SET @plan_charset = (
  SELECT CHARACTER_SET_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'plans'
    AND COLUMN_NAME = 'id'
  LIMIT 1
);

SET @plan_collation = (
  SELECT COLLATION_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'plans'
    AND COLUMN_NAME = 'id'
  LIMIT 1
);

SET @sql = CONCAT(
  'ALTER TABLE subscriptions MODIFY plan_id ', @plan_type, ' NOT NULL',
  IF(@plan_charset IS NOT NULL, CONCAT(' CHARACTER SET ', @plan_charset), ''),
  IF(@plan_collation IS NOT NULL, CONCAT(' COLLATE ', @plan_collation), '')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Add FKs
-- ============================================================

ALTER TABLE subscriptions
  ADD CONSTRAINT fk_sub_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
  ON DELETE CASCADE;

ALTER TABLE subscriptions
  ADD CONSTRAINT fk_sub_plan
  FOREIGN KEY (plan_id) REFERENCES plans(id);

ALTER TABLE usage_periods
  ADD CONSTRAINT fk_usage_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
  ON DELETE CASCADE;

ALTER TABLE email_connections
  ADD CONSTRAINT fk_mailconn_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
  ON DELETE CASCADE;

-- ------------------------------------------------------ platform admin
-- These are intentionally added only if they do not already exist.

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'is_super_admin'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN is_super_admin TINYINT(1) NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'must_change_password'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'created_by'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN created_by CHAR(36) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'workspaces'
      AND COLUMN_NAME = 'status'
  ),
  'SELECT 1',
  'ALTER TABLE workspaces ADD COLUMN status ENUM(''active'',''suspended'') NOT NULL DEFAULT ''active'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------- default plans
INSERT INTO plans
  (id, name, slug, description, price_monthly, price_yearly, max_contacts, max_emails_per_month,
   max_team_members, max_sender_identities, max_domains, ai_credits_per_day,
   allow_custom_smtp, allow_api_access, allow_ai, allow_segments, remove_branding, sort_order)
VALUES
  (UUID(), 'Free',     'free',     'Try MailFlow with a small list.',              0,     0,   500,   2000, 1,  1, 0,  10, 0, 0, 1, 0, 0, 1),
  (UUID(), 'Starter',  'starter', 'For a single brand getting going.',          999,  9990,  5000,  25000, 3,  3, 1,  50, 0, 0, 1, 1, 1, 2),
  (UUID(), 'Growth',   'growth',   'Own SMTP, API access, bigger lists.',       2999, 29990, 25000, 150000, 10, 10, 5, 200, 1, 1, 1, 1, 1, 3),
  (UUID(), 'Agency',   'agency',   'Unlimited sending for client work.',        7999, 79990,    -1,     -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

