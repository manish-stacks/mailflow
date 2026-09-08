-- MailFlow — Email Marketing SaaS (MySQL 8+)
CREATE DATABASE IF NOT EXISTS mailflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mailflow;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100), last_name VARCHAR(100),
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(128) NULL,
  reset_token VARCHAR(128) NULL, reset_token_expires_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_reset (reset_token)
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  user_agent VARCHAR(255) NULL, ip VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id), INDEX idx_rt_hash (token_hash)
) ENGINE=InnoDB;

CREATE TABLE workspaces (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  owner_id CHAR(36) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  ai_daily_limit INT NOT NULL DEFAULT 200,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ws_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE workspace_members (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  invited_email VARCHAR(255) NULL,
  invite_token VARCHAR(128) NULL,
  status ENUM('active','invited','disabled') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ws_user (workspace_id, user_id),
  CONSTRAINT fk_wm_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_wm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_wm_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE contacts (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NULL, last_name VARCHAR(100) NULL, phone VARCHAR(50) NULL,
  status ENUM('active','unsubscribed','bounced','complained','suppressed') NOT NULL DEFAULT 'active',
  subscribed TINYINT(1) NOT NULL DEFAULT 1,
  custom_attributes JSON NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  last_engaged_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contact_ws_email (workspace_id, email),
  CONSTRAINT fk_ct_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_ct_ws_status (workspace_id, status),
  INDEX idx_ct_created (workspace_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE contact_lists (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  contact_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cl_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_cl_ws (workspace_id)
) ENGINE=InnoDB;

CREATE TABLE contact_list_members (
  id CHAR(36) PRIMARY KEY,
  list_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_list_contact (list_id, contact_id),
  CONSTRAINT fk_clm_list FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_clm_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_clm_contact (contact_id)
) ENGINE=InnoDB;

CREATE TABLE segments (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  match_type ENUM('all','any') NOT NULL DEFAULT 'all',
  rules JSON NOT NULL,
  cached_count INT NULL, cached_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sg_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_sg_ws (workspace_id)
) ENGINE=InnoDB;

CREATE TABLE sender_identities (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  from_name VARCHAR(150) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255) NULL,
  status ENUM('pending','verified','failed') NOT NULL DEFAULT 'pending',
  verification_token VARCHAR(128) NULL,
  verified_at DATETIME NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sender_ws_email (workspace_id, from_email),
  CONSTRAINT fk_si_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sender_domains (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'smtp',
  verification_status ENUM('pending','verifying','verified','failed') NOT NULL DEFAULT 'pending',
  verification_records JSON NULL,
  last_checked_at DATETIME NULL, verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_domain_ws (workspace_id, domain),
  CONSTRAINT fk_sd_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_templates (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'general',
  subject VARCHAR(255) NULL,
  preview_text VARCHAR(255) NULL,
  html_content MEDIUMTEXT NULL,
  design_json JSON NULL,
  thumbnail VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tpl_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_tpl_ws (workspace_id, category)
) ENGINE=InnoDB;

CREATE TABLE campaigns (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  subject VARCHAR(255) NULL,
  preview_text VARCHAR(255) NULL,
  html_content MEDIUMTEXT NULL,
  design_json JSON NULL,
  template_id CHAR(36) NULL,
  sender_identity_id CHAR(36) NULL,
  audience JSON NULL,
  settings JSON NULL,
  status ENUM('draft','scheduled','preparing','sending','completed','paused','cancelled','failed') NOT NULL DEFAULT 'draft',
  scheduled_at DATETIME NULL, started_at DATETIME NULL, completed_at DATETIME NULL,
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0, delivered_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0, bounced_count INT NOT NULL DEFAULT 0,
  complained_count INT NOT NULL DEFAULT 0, unsubscribed_count INT NOT NULL DEFAULT 0,
  unique_opens INT NOT NULL DEFAULT 0, total_opens INT NOT NULL DEFAULT 0,
  unique_clicks INT NOT NULL DEFAULT 0, total_clicks INT NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cp_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_sender FOREIGN KEY (sender_identity_id) REFERENCES sender_identities(id) ON DELETE SET NULL,
  CONSTRAINT fk_cp_tpl FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
  INDEX idx_cp_ws_status (workspace_id, status),
  INDEX idx_cp_scheduled (scheduled_at)
) ENGINE=InnoDB;

CREATE TABLE campaign_recipients (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  campaign_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('pending','queued','sent','delivered','bounced','failed','skipped') NOT NULL DEFAULT 'pending',
  error_message VARCHAR(500) NULL,
  message_id VARCHAR(255) NULL,
  open_count INT NOT NULL DEFAULT 0, click_count INT NOT NULL DEFAULT 0,
  sent_at DATETIME NULL, delivered_at DATETIME NULL, opened_at DATETIME NULL,
  clicked_at DATETIME NULL, bounced_at DATETIME NULL, unsubscribed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cr_campaign_contact (campaign_id, contact_id),
  CONSTRAINT fk_cr_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_cr_campaign_status (campaign_id, status),
  INDEX idx_cr_contact (contact_id),
  INDEX idx_cr_email (email),
  INDEX idx_cr_msgid (message_id)
) ENGINE=InnoDB;

CREATE TABLE campaign_events (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  campaign_id CHAR(36) NOT NULL,
  campaign_recipient_id CHAR(36) NULL,
  contact_id CHAR(36) NULL,
  event_type ENUM('sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed') NOT NULL,
  metadata JSON NULL,
  dedupe_key VARCHAR(191) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_dedupe (dedupe_key),
  CONSTRAINT fk_ce_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_ce_campaign_type (campaign_id, event_type),
  INDEX idx_ce_recipient (campaign_recipient_id),
  INDEX idx_ce_contact (contact_id),
  INDEX idx_ce_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE tracked_links (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  campaign_id CHAR(36) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  url_hash CHAR(64) NOT NULL,
  label VARCHAR(255) NULL,
  total_clicks INT NOT NULL DEFAULT 0,
  unique_clicks INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tl_campaign_url (campaign_id, url_hash),
  CONSTRAINT fk_tl_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE unsubscribes (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NULL,
  campaign_id CHAR(36) NULL,
  email VARCHAR(255) NOT NULL,
  reason VARCHAR(255) NULL,
  ip VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_un_ws_email (workspace_id, email)
) ENGINE=InnoDB;

CREATE TABLE suppressions (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  reason ENUM('unsubscribe','hard_bounce','complaint','manual') NOT NULL,
  source VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sup_ws_email (workspace_id, email),
  CONSTRAINT fk_sup_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE uploaded_files (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  uploaded_by CHAR(36) NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  purpose VARCHAR(50) NOT NULL DEFAULT 'image',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uf_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_uf_ws (workspace_id, purpose)
) ENGINE=InnoDB;

CREATE TABLE import_jobs (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  file_id CHAR(36) NULL,
  list_id CHAR(36) NULL,
  mapping JSON NOT NULL,
  status ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  total_rows INT NOT NULL DEFAULT 0, valid_rows INT NOT NULL DEFAULT 0,
  invalid_rows INT NOT NULL DEFAULT 0, duplicate_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0, failed_rows INT NOT NULL DEFAULT 0,
  errors JSON NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ij_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE api_keys (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  scopes JSON NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ak_ws FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_ak_prefix (key_prefix)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id CHAR(36) NULL,
  metadata JSON NULL,
  ip VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_ws (workspace_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE ai_usage (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  feature VARCHAR(60) NOT NULL,
  tokens_in INT NOT NULL DEFAULT 0, tokens_out INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_ws_date (workspace_id, created_at)
) ENGINE=InnoDB;
