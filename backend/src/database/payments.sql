-- MailFlow — Razorpay payments (safe/adaptive version)
-- Run AFTER saas.sql.
-- This version avoids errno 150 by making the FK columns match the
-- actual workspaces.id / plans.id definitions before adding FKs.
-- Requires MySQL 8.0+ / MariaDB with INFORMATION_SCHEMA support.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS payments;

CREATE TABLE payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(255) NULL,
  user_id CHAR(36) NULL,

  invoice_number VARCHAR(40) NULL,
  gateway ENUM('razorpay','manual') NOT NULL DEFAULT 'razorpay',
  order_id VARCHAR(80) NULL,
  payment_id VARCHAR(80) NULL,
  refund_id VARCHAR(80) NULL,

  amount INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  billing_cycle ENUM('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',

  status ENUM('created','pending','paid','failed','refunded') NOT NULL DEFAULT 'created',
  method VARCHAR(40) NULL,
  failure_reason VARCHAR(500) NULL,
  notes JSON NULL,
  paid_at DATETIME NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_payment_order (order_id),
  UNIQUE KEY uq_payment_invoice (invoice_number),
  KEY idx_payment_ws (workspace_id, created_at),
  KEY idx_payment_status (status),
  KEY idx_payment_payment_id (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------
-- Match workspace_id exactly to workspaces.id, then add FK.
-- ------------------------------------------------------------------
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
  'ALTER TABLE payments MODIFY workspace_id ', @ws_type, ' NOT NULL',
  IF(@ws_charset IS NOT NULL, CONCAT(' CHARACTER SET ', @ws_charset), ''),
  IF(@ws_collation IS NOT NULL, CONCAT(' COLLATE ', @ws_collation), '')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE payments
  ADD CONSTRAINT fk_payment_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
  ON DELETE CASCADE;

-- ------------------------------------------------------------------
-- Match plan_id exactly to plans.id, then add FK.
-- ------------------------------------------------------------------
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
  'ALTER TABLE payments MODIFY plan_id ', @plan_type, ' NULL',
  IF(@plan_charset IS NOT NULL, CONCAT(' CHARACTER SET ', @plan_charset), ''),
  IF(@plan_collation IS NOT NULL, CONCAT(' COLLATE ', @plan_collation), '')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE payments
  ADD CONSTRAINT fk_payment_plan
  FOREIGN KEY (plan_id) REFERENCES plans(id);

-- ------------------------------------------------------------------
-- Billing contact details.
-- If these columns already exist, comment these 4 statements out.
-- ------------------------------------------------------------------
ALTER TABLE workspaces ADD COLUMN billing_name VARCHAR(200) NULL;
ALTER TABLE workspaces ADD COLUMN billing_email VARCHAR(255) NULL;
ALTER TABLE workspaces ADD COLUMN billing_address VARCHAR(500) NULL;
ALTER TABLE workspaces ADD COLUMN billing_gstin VARCHAR(20) NULL;
