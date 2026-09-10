-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 09, 2026 at 02:42 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mailflow`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_usage`
--

CREATE TABLE `ai_usage` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `feature` varchar(60) NOT NULL,
  `tokens_in` int(11) NOT NULL DEFAULT 0,
  `tokens_out` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_usage`
--

INSERT INTO `ai_usage` (`id`, `workspace_id`, `user_id`, `feature`, `tokens_in`, `tokens_out`, `created_at`) VALUES
('26f6ffe6-af74-464a-a912-ba5179fca649', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'rewrite_grammar', 64, 68, '2026-09-09 15:08:22'),
('cbcec362-8060-4494-9a2d-4e97761b0c67', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'generate_email', 207, 568, '2026-09-09 13:05:34');

-- --------------------------------------------------------

--
-- Table structure for table `api_keys`
--

CREATE TABLE `api_keys` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `key_prefix` varchar(16) NOT NULL,
  `key_hash` varchar(255) NOT NULL,
  `scopes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scopes`)),
  `last_used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `api_keys`
--

INSERT INTO `api_keys` (`id`, `workspace_id`, `name`, `key_prefix`, `key_hash`, `scopes`, `last_used_at`, `revoked_at`, `created_by`, `created_at`) VALUES
('ddaf6c02-9b8d-4bce-827c-7f74adade900', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Web', 'mf_43e8e7bc', '$2b$10$giNBSA/omjiRw3uYoiZ1TeBkt01KGq1H3Vt46ueiLf47KGsk6OlXy', '[\"contacts:read\",\"campaigns:read\"]', NULL, NULL, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '2026-09-09 13:55:58');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(80) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `preview_text` varchar(255) DEFAULT NULL,
  `html_content` mediumtext DEFAULT NULL,
  `design_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`design_json`)),
  `template_id` char(36) DEFAULT NULL,
  `sender_identity_id` char(36) DEFAULT NULL,
  `audience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`audience`)),
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `status` enum('draft','scheduled','preparing','sending','completed','paused','cancelled','failed') NOT NULL DEFAULT 'draft',
  `scheduled_at` datetime DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `total_recipients` int(11) NOT NULL DEFAULT 0,
  `sent_count` int(11) NOT NULL DEFAULT 0,
  `delivered_count` int(11) NOT NULL DEFAULT 0,
  `failed_count` int(11) NOT NULL DEFAULT 0,
  `bounced_count` int(11) NOT NULL DEFAULT 0,
  `complained_count` int(11) NOT NULL DEFAULT 0,
  `unsubscribed_count` int(11) NOT NULL DEFAULT 0,
  `unique_opens` int(11) NOT NULL DEFAULT 0,
  `total_opens` int(11) NOT NULL DEFAULT 0,
  `unique_clicks` int(11) NOT NULL DEFAULT 0,
  `total_clicks` int(11) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaigns`
--

INSERT INTO `campaigns` (`id`, `workspace_id`, `name`, `subject`, `preview_text`, `html_content`, `design_json`, `template_id`, `sender_identity_id`, `audience`, `settings`, `status`, `scheduled_at`, `started_at`, `completed_at`, `total_recipients`, `sent_count`, `delivered_count`, `failed_count`, `bounced_count`, `complained_count`, `unsubscribed_count`, `unique_opens`, `total_opens`, `unique_clicks`, `total_clicks`, `created_by`, `deleted_at`, `created_at`, `updated_at`) VALUES
('1b60de77-d841-4c80-bbaa-0ba5cf583c20', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'September newsletter v2', 'Your September update is here. ', 'Plus a new feature we think you will like', '<!doctype html>\n<html>\n  <body style=\"margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;\">\n    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f5f7;padding:32px 0;\">\n      <tr>\n        <td align=\"center\">\n          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;\">\n            <tr>\n              <td style=\"background:#4f46e5;padding:24px 32px;\">\n                <span style=\"color:#ffffff;font-size:20px;font-weight:bold;\">Welcome!</span>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:32px;color:#1f2937;font-size:15px;line-height:1.6;\">\n                <p>Hi {{first_name | default: \"there\"}},</p>\n                <p>Thanks for signing up! We\'\'re glad to have you here. This is a good place to tell people what to expect next — your first steps, a quick tip, or a link to get set up.</p>\n\n                <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\">\n                  <tr>\n                    <td style=\"background:#4f46e5;border-radius:6px;\">\n                      <a href=\"https://example.com/get-started\" style=\"display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;\">Get Started</a>\n                    </td>\n                  </tr>\n                </table>\n\n                <p>If you have any questions, just reply to this email — a real person will read it.</p>\n                <p>— The Team</p>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:20px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;\">\n                You\'\'re receiving this because you\'\'re subscribed to updates from us.<br/>\n                <a href=\"{{unsubscribe_url}}\" style=\"color:#9ca3af;\">Unsubscribe</a>\n              </td>\n            </tr>\n          </table>\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>', NULL, 'aea63891-e442-4961-af1b-5da045b7ce75', 'c994e4e9-9d36-4a8c-8cf3-4553d5dd304d', '{\"mode\":\"lists\",\"listIds\":[\"f367712d-bef6-4ad3-87b7-720dc755b840\"]}', '{\"trackOpens\":true,\"trackClicks\":true,\"includeUnsubscribeLink\":true}', 'completed', NULL, '2026-09-09 10:18:38', '2026-09-09 10:18:41', 3, 3, 3, 0, 0, 0, 0, 0, 0, 1, 1, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', NULL, '2026-09-09 15:46:27', '2026-09-09 16:01:46'),
('b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'September newsletter (copy)', 'Your September update is here. ', 'Plus a new feature we think you will like', '<!doctype html>\n<html>\n  <body style=\"margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;\">\n    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f5f7;padding:32px 0;\">\n      <tr>\n        <td align=\"center\">\n          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;\">\n            <tr>\n              <td style=\"background:#4f46e5;padding:24px 32px;\">\n                <span style=\"color:#ffffff;font-size:20px;font-weight:bold;\">Welcome!</span>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:32px;color:#1f2937;font-size:15px;line-height:1.6;\">\n                <p>Hi {{first_name | default: \"there\"}},</p>\n                <p>Thanks for signing up! We\'\'re glad to have you here. This is a good place to tell people what to expect next — your first steps, a quick tip, or a link to get set up.</p>\n\n                <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\">\n                  <tr>\n                    <td style=\"background:#4f46e5;border-radius:6px;\">\n                      <a href=\"https://example.com/get-started\" style=\"display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;\">Get Started</a>\n                    </td>\n                  </tr>\n                </table>\n\n                <p>If you have any questions, just reply to this email — a real person will read it.</p>\n                <p>— The Team</p>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:20px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;\">\n                You\'\'re receiving this because you\'\'re subscribed to updates from us.<br/>\n                <a href=\"{{unsubscribe_url}}\" style=\"color:#9ca3af;\">Unsubscribe</a>\n              </td>\n            </tr>\n          </table>\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>', NULL, 'aea63891-e442-4961-af1b-5da045b7ce75', 'c994e4e9-9d36-4a8c-8cf3-4553d5dd304d', '{\"mode\":\"lists\",\"listIds\":[\"f367712d-bef6-4ad3-87b7-720dc755b840\"]}', '{\"trackOpens\":true,\"trackClicks\":true,\"includeUnsubscribeLink\":true}', 'completed', NULL, '2026-09-09 09:56:35', '2026-09-09 09:56:38', 2, 2, 0, 0, 0, 0, 1, 0, 0, 1, 2, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', NULL, '2026-09-09 15:25:27', '2026-09-09 16:00:58'),
('e56170cb-ddc1-4eb7-8c5d-4f89f447d587', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'September newsletter', 'Your September update is here. ', 'Plus a new feature we think you will like', '<!doctype html>\n<html>\n  <body style=\"margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;\">\n    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f5f7;padding:32px 0;\">\n      <tr>\n        <td align=\"center\">\n          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;\">\n            <tr>\n              <td style=\"background:#4f46e5;padding:24px 32px;\">\n                <span style=\"color:#ffffff;font-size:20px;font-weight:bold;\">Welcome!</span>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:32px;color:#1f2937;font-size:15px;line-height:1.6;\">\n                <p>Hi {{first_name | default: \"there\"}},</p>\n                <p>Thanks for signing up! We\'\'re glad to have you here. This is a good place to tell people what to expect next — your first steps, a quick tip, or a link to get set up.</p>\n\n                <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\">\n                  <tr>\n                    <td style=\"background:#4f46e5;border-radius:6px;\">\n                      <a href=\"https://example.com/get-started\" style=\"display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;\">Get Started</a>\n                    </td>\n                  </tr>\n                </table>\n\n                <p>If you have any questions, just reply to this email — a real person will read it.</p>\n                <p>— The Team</p>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:20px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;\">\n                You\'\'re receiving this because you\'\'re subscribed to updates from us.<br/>\n                <a href=\"{{unsubscribe_url}}\" style=\"color:#9ca3af;\">Unsubscribe</a>\n              </td>\n            </tr>\n          </table>\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>', NULL, 'aea63891-e442-4961-af1b-5da045b7ce75', 'c994e4e9-9d36-4a8c-8cf3-4553d5dd304d', '{\"mode\":\"lists\",\"listIds\":[\"f367712d-bef6-4ad3-87b7-720dc755b840\"]}', '{\"trackOpens\":true,\"trackClicks\":true,\"includeUnsubscribeLink\":true}', 'completed', NULL, '2026-09-09 09:40:14', '2026-09-09 09:40:16', 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', NULL, '2026-09-09 15:08:42', '2026-09-09 15:10:16');

-- --------------------------------------------------------

--
-- Table structure for table `campaign_events`
--

CREATE TABLE `campaign_events` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `campaign_id` char(36) NOT NULL,
  `campaign_recipient_id` char(36) DEFAULT NULL,
  `contact_id` char(36) DEFAULT NULL,
  `event_type` enum('sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed') NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `dedupe_key` varchar(191) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaign_events`
--

INSERT INTO `campaign_events` (`id`, `workspace_id`, `campaign_id`, `campaign_recipient_id`, `contact_id`, `event_type`, `metadata`, `dedupe_key`, `created_at`) VALUES
('0fd7fe6c-5354-4ef0-be92-64ec05d3bced', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'e56170cb-ddc1-4eb7-8c5d-4f89f447d587', 'efa12a58-7a46-45dc-a9f0-fbe859e3925e', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'sent', '{\"messageId\":\"<f3845417-5262-5652-63f5-d896bee3f401@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:10:16'),
('153a999d-fe13-4762-9a1e-9c56f8c311fd', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '2c6946ac-b4ed-4fee-a0ee-b8a241e40367', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'clicked', '{\"url\":\"https://example.com/get-started\",\"ip\":\"::1\",\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36\"}', 'click:2c6946ac-b4ed-4fee-a0ee-b8a241e40367:129048bd-727d-48c4-9a7f-2baf0c73fccb', '2026-09-09 16:01:46'),
('3ab4dc3d-757d-4acb-a9d6-8c1d1aee6815', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', 'd323caeb-172f-47b2-be49-d96cb8371a5d', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'unsubscribed', '{}', 'unsub:d323caeb-172f-47b2-be49-d96cb8371a5d', '2026-09-09 16:00:58'),
('57c3a338-f442-4b7c-9837-ef66012276ce', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', '43c430a8-6428-423f-b985-24ee476d150e', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'sent', '{\"messageId\":\"<e9b22cc7-8827-191b-0e5b-2bdb78c4e068@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:26:38'),
('65a984d3-09b2-47a6-9341-4861e34cadda', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', 'd323caeb-172f-47b2-be49-d96cb8371a5d', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'clicked', '{\"url\":\"https://example.com/get-started\",\"ip\":\"::1\",\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36\"}', 'click:d323caeb-172f-47b2-be49-d96cb8371a5d:58aa3e50-66d4-4a61-9bb3-8679e574b440', '2026-09-09 16:00:11'),
('680ae379-8ca8-4242-8168-c21d825c54fc', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '2c6946ac-b4ed-4fee-a0ee-b8a241e40367', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'delivered', '{\"messageId\":\"<f34a5bca-3d21-54af-6455-dbc7839691c3@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:48:40'),
('6ab8650f-6bc9-4275-bbc7-0f4ae0d9b7b8', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', 'd323caeb-172f-47b2-be49-d96cb8371a5d', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'sent', '{\"messageId\":\"<ed2e8681-afee-051e-a38d-94065ef48259@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:26:38'),
('796aa276-fb18-440a-bc51-e6194d18545c', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', 'ba65b600-d371-4df8-b637-0bd22515378b', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'sent', '{\"messageId\":\"<3effb25a-8db2-0f44-e71b-b1e3008470a0@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:48:40'),
('7a857272-db23-4eb2-a3ea-a38ebc62a67b', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '9799d3d0-75da-4c63-ac36-51f2dfc115ff', '7fce9649-7ccf-4be4-aa4d-f86e7ccddc45', 'delivered', '{\"messageId\":\"<a0a7527b-991b-e111-5141-1f12f7aa5de5@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:48:41'),
('93191786-fa11-4a34-b3ac-8c03edf62f3a', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'e56170cb-ddc1-4eb7-8c5d-4f89f447d587', '63abdd78-068c-4733-ba5b-ebe22ee55d98', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'sent', '{\"messageId\":\"<e00600a3-dd8a-3d2e-816f-e7632f6454cb@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:10:16'),
('a5ed8c16-4466-40af-9a95-a919de8a2645', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', 'd323caeb-172f-47b2-be49-d96cb8371a5d', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'clicked', '{\"url\":\"https://example.com/get-started\",\"ip\":\"::1\",\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36\"}', NULL, '2026-09-09 16:00:20'),
('aba22d8d-48f5-47ec-a50d-f7dfa21aef1b', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '2c6946ac-b4ed-4fee-a0ee-b8a241e40367', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'sent', '{\"messageId\":\"<f34a5bca-3d21-54af-6455-dbc7839691c3@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:48:40'),
('c05e631b-cda1-4044-a4d9-f36b39882a22', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', 'ba65b600-d371-4df8-b637-0bd22515378b', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'delivered', '{\"messageId\":\"<3effb25a-8db2-0f44-e71b-b1e3008470a0@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:48:40'),
('ec15658f-90cc-4da2-a01f-9fdc6840a6ac', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '9799d3d0-75da-4c63-ac36-51f2dfc115ff', '7fce9649-7ccf-4be4-aa4d-f86e7ccddc45', 'sent', '{\"messageId\":\"<a0a7527b-991b-e111-5141-1f12f7aa5de5@hoverbusinessservices.in>\"}', NULL, '2026-09-09 15:48:41');

-- --------------------------------------------------------

--
-- Table structure for table `campaign_recipients`
--

CREATE TABLE `campaign_recipients` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `campaign_id` char(36) NOT NULL,
  `contact_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `status` enum('pending','queued','sent','delivered','bounced','failed','skipped') NOT NULL DEFAULT 'pending',
  `error_message` varchar(500) DEFAULT NULL,
  `message_id` varchar(255) DEFAULT NULL,
  `open_count` int(11) NOT NULL DEFAULT 0,
  `click_count` int(11) NOT NULL DEFAULT 0,
  `sent_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  `clicked_at` datetime DEFAULT NULL,
  `bounced_at` datetime DEFAULT NULL,
  `unsubscribed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaign_recipients`
--

INSERT INTO `campaign_recipients` (`id`, `workspace_id`, `campaign_id`, `contact_id`, `email`, `status`, `error_message`, `message_id`, `open_count`, `click_count`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`, `unsubscribed_at`, `created_at`, `updated_at`) VALUES
('2c6946ac-b4ed-4fee-a0ee-b8a241e40367', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'mks957678@gmail.com', 'delivered', NULL, '<f34a5bca-3d21-54af-6455-dbc7839691c3@hoverbusinessservices.in>', 0, 1, '2026-09-09 10:18:40', '2026-09-09 10:18:40', '2026-09-09 10:31:46', '2026-09-09 10:31:46', NULL, NULL, '2026-09-09 15:48:38', '2026-09-09 16:01:46'),
('43c430a8-6428-423f-b985-24ee476d150e', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'mks957678@gmail.com', 'sent', NULL, '<e9b22cc7-8827-191b-0e5b-2bdb78c4e068@hoverbusinessservices.in>', 0, 0, '2026-09-09 09:56:38', NULL, NULL, NULL, NULL, NULL, '2026-09-09 15:26:35', '2026-09-09 15:26:38'),
('63abdd78-068c-4733-ba5b-ebe22ee55d98', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'e56170cb-ddc1-4eb7-8c5d-4f89f447d587', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', 'mks957678@gmail.com', 'sent', NULL, '<e00600a3-dd8a-3d2e-816f-e7632f6454cb@hoverbusinessservices.in>', 0, 0, '2026-09-09 09:40:16', NULL, NULL, NULL, NULL, NULL, '2026-09-09 15:10:14', '2026-09-09 15:10:16'),
('9799d3d0-75da-4c63-ac36-51f2dfc115ff', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '7fce9649-7ccf-4be4-aa4d-f86e7ccddc45', 'hiteshy468@gmail.com', 'delivered', NULL, '<a0a7527b-991b-e111-5141-1f12f7aa5de5@hoverbusinessservices.in>', 0, 0, '2026-09-09 10:18:41', '2026-09-09 10:18:41', NULL, NULL, NULL, NULL, '2026-09-09 15:48:38', '2026-09-09 15:48:41'),
('ba65b600-d371-4df8-b637-0bd22515378b', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'hbsdevelopersteam@gmail.com', 'delivered', NULL, '<3effb25a-8db2-0f44-e71b-b1e3008470a0@hoverbusinessservices.in>', 0, 0, '2026-09-09 10:18:40', '2026-09-09 10:18:40', NULL, NULL, NULL, NULL, '2026-09-09 15:48:38', '2026-09-09 15:48:40'),
('d323caeb-172f-47b2-be49-d96cb8371a5d', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'hbsdevelopersteam@gmail.com', 'sent', NULL, '<ed2e8681-afee-051e-a38d-94065ef48259@hoverbusinessservices.in>', 0, 2, '2026-09-09 09:56:38', NULL, '2026-09-09 10:30:11', '2026-09-09 10:30:11', NULL, '2026-09-09 10:30:58', '2026-09-09 15:26:35', '2026-09-09 16:00:58'),
('efa12a58-7a46-45dc-a9f0-fbe859e3925e', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'e56170cb-ddc1-4eb7-8c5d-4f89f447d587', '95b19acf-d856-46ee-a46e-730ba46dfd9c', 'hbsdevelopersteam@gmail.com', 'sent', NULL, '<f3845417-5262-5652-63f5-d896bee3f401@hoverbusinessservices.in>', 0, 0, '2026-09-09 09:40:16', NULL, NULL, NULL, NULL, NULL, '2026-09-09 15:10:14', '2026-09-09 15:10:16');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('active','unsubscribed','bounced','complained','suppressed') NOT NULL DEFAULT 'active',
  `subscribed` tinyint(1) NOT NULL DEFAULT 1,
  `custom_attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_attributes`)),
  `source` varchar(50) NOT NULL DEFAULT 'manual',
  `last_engaged_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `workspace_id`, `email`, `first_name`, `last_name`, `phone`, `status`, `subscribed`, `custom_attributes`, `source`, `last_engaged_at`, `created_at`, `updated_at`) VALUES
('7fce9649-7ccf-4be4-aa4d-f86e7ccddc45', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'hiteshy468@gmail.com', 'Hitesh', 'Yadav', '', 'active', 1, '{}', 'manual', NULL, '2026-09-09 15:39:30', '2026-09-09 15:39:30'),
('95b19acf-d856-46ee-a46e-730ba46dfd9c', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'hbsdevelopersteam@gmail.com', 'Hover', 'Business', '', 'unsubscribed', 0, '{}', 'manual', '2026-09-09 10:30:11', '2026-09-09 15:06:52', '2026-09-09 16:00:58'),
('ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'mks957678@gmail.com', 'Manish', 'sharma', '', 'active', 1, '{}', 'manual', '2026-09-09 10:31:46', '2026-09-09 15:07:06', '2026-09-09 16:01:46');

-- --------------------------------------------------------

--
-- Table structure for table `contact_lists`
--

CREATE TABLE `contact_lists` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `contact_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_lists`
--

INSERT INTO `contact_lists` (`id`, `workspace_id`, `name`, `description`, `contact_count`, `created_at`, `updated_at`) VALUES
('f367712d-bef6-4ad3-87b7-720dc755b840', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Newsletter subscribers', 'test', 3, '2026-09-09 15:06:41', '2026-09-09 15:40:49');

-- --------------------------------------------------------

--
-- Table structure for table `contact_list_members`
--

CREATE TABLE `contact_list_members` (
  `id` char(36) NOT NULL,
  `list_id` char(36) NOT NULL,
  `contact_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_list_members`
--

INSERT INTO `contact_list_members` (`id`, `list_id`, `contact_id`, `created_at`) VALUES
('48d50c81-1a1c-4ced-b430-f1f5cd07d34c', 'f367712d-bef6-4ad3-87b7-720dc755b840', 'ec80230d-7bd8-4f26-8cc0-7e2b9d8c3abe', '2026-09-09 15:07:18'),
('697d4a71-a5af-4fd6-966b-bef853c9b8ff', 'f367712d-bef6-4ad3-87b7-720dc755b840', '7fce9649-7ccf-4be4-aa4d-f86e7ccddc45', '2026-09-09 15:40:31'),
('90126443-0e5e-4d7c-bfa2-83aeabcab7d5', 'f367712d-bef6-4ad3-87b7-720dc755b840', '95b19acf-d856-46ee-a46e-730ba46dfd9c', '2026-09-09 15:07:18');

-- --------------------------------------------------------

--
-- Table structure for table `email_connections`
--

CREATE TABLE `email_connections` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `label` varchar(120) NOT NULL DEFAULT 'Primary',
  `provider` enum('smtp','gmail','outlook','ses','brevo','sendgrid','mailgun') NOT NULL DEFAULT 'smtp',
  `host` varchar(255) NOT NULL,
  `port` int(11) NOT NULL DEFAULT 587,
  `secure` tinyint(1) NOT NULL DEFAULT 0,
  `username` varchar(255) DEFAULT NULL,
  `password_enc` text DEFAULT NULL,
  `from_name` varchar(150) DEFAULT NULL,
  `from_email` varchar(255) DEFAULT NULL,
  `daily_limit` int(11) NOT NULL DEFAULT 0,
  `rate_per_minute` int(11) NOT NULL DEFAULT 0,
  `status` enum('untested','verified','failed') NOT NULL DEFAULT 'untested',
  `last_error` varchar(500) DEFAULT NULL,
  `last_tested_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_connections`
--

INSERT INTO `email_connections` (`id`, `workspace_id`, `label`, `provider`, `host`, `port`, `secure`, `username`, `password_enc`, `from_name`, `from_email`, `daily_limit`, `rate_per_minute`, `status`, `last_error`, `last_tested_at`, `is_active`, `created_at`, `updated_at`) VALUES
('22c4d190-e188-477e-84c6-d89a43b6bcd0', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Primary', 'smtp', 'smtp.hostinger.com', 465, 1, 'support@hoverbusinessservices.in', 'v1.fkj/WhURMo9qF6de.K5t0gDWh4EQcplmZHvz8ZA==.H9KwM4Wf8lstng==', 'Hover Business Services LLP', 'support@hoverbusinessservices.in', 0, 0, 'verified', NULL, '2026-09-09 09:34:49', 1, '2026-09-09 15:03:36', '2026-09-09 15:04:49');

-- --------------------------------------------------------

--
-- Table structure for table `email_templates`
--

CREATE TABLE `email_templates` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(80) NOT NULL DEFAULT 'general',
  `subject` varchar(255) DEFAULT NULL,
  `preview_text` varchar(255) DEFAULT NULL,
  `html_content` mediumtext DEFAULT NULL,
  `design_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`design_json`)),
  `thumbnail` varchar(500) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_templates`
--

INSERT INTO `email_templates` (`id`, `workspace_id`, `name`, `category`, `subject`, `preview_text`, `html_content`, `design_json`, `thumbnail`, `created_by`, `deleted_at`, `created_at`, `updated_at`) VALUES
('1028d212-9cfe-4a53-a698-611d774185ab', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Untitled template', 'general', '', NULL, '<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1f2937\">\n  <h1 style=\"font-size:24px;margin:0 0 16px\">Hello {{first_name | default: \"there\"}}</h1>\n  <p style=\"font-size:15px;line-height:1.6;margin:0 0 20px\">Write your message here.</p>\n  <a href=\"https://example.com\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600\">Call to action</a>\n</div>', NULL, NULL, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '2026-09-09 16:13:03', '2026-09-09 16:10:47', '2026-09-09 16:13:03'),
('44508952-41fa-4f6d-b773-5a4f55c774c1', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Untitled template', 'general', '', NULL, '<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1f2937\">\n  <h1 style=\"font-size:24px;margin:0 0 16px\">Hello {{first_name | default: \"there\"}}</h1>\n  <p style=\"font-size:15px;line-height:1.6;margin:0 0 20px\">Write your message here.</p>\n  <a href=\"https://example.com\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600\">Call to action</a>\n</div>', NULL, NULL, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '2026-09-09 16:10:46', '2026-09-09 15:50:20', '2026-09-09 16:10:46'),
('accc976b-051d-41f3-8de4-375684c27662', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Untitled template', 'general', '', NULL, '<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1f2937\">\n  <h1 style=\"font-size:24px;margin:0 0 16px\">Hello {{first_name | default: \"there\"}}</h1>\n  <p style=\"font-size:15px;line-height:1.6;margin:0 0 20px\">Write your message here.</p>\n  <a href=\"https://example.com\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600\">Call to action</a>\n</div>', NULL, NULL, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', NULL, '2026-09-09 16:13:12', '2026-09-09 16:13:12'),
('aea63891-e442-4961-af1b-5da045b7ce75', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Welcome Email', 'general', 'Welcome aboard, {{first_name | default: \"there\"}}! 🎉', 'Here\'\'s how to get started.', '<!doctype html>\n<html>\n  <body style=\"margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;\">\n    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f5f7;padding:32px 0;\">\n      <tr>\n        <td align=\"center\">\n          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;\">\n            <tr>\n              <td style=\"background:#4f46e5;padding:24px 32px;\">\n                <span style=\"color:#ffffff;font-size:20px;font-weight:bold;\">Welcome!</span>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:32px;color:#1f2937;font-size:15px;line-height:1.6;\">\n                <p>Hi {{first_name | default: \"there\"}},</p>\n                <p>Thanks for signing up! We\'\'re glad to have you here. This is a good place to tell people what to expect next — your first steps, a quick tip, or a link to get set up.</p>\n\n                <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\">\n                  <tr>\n                    <td style=\"background:#4f46e5;border-radius:6px;\">\n                      <a href=\"https://example.com/get-started\" style=\"display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;\">Get Started</a>\n                    </td>\n                  </tr>\n                </table>\n\n                <p>If you have any questions, just reply to this email — a real person will read it.</p>\n                <p>— The Team</p>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:20px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;\">\n                You\'\'re receiving this because you\'\'re subscribed to updates from us.<br/>\n                <a href=\"{{unsubscribe_url}}\" style=\"color:#9ca3af;\">Unsubscribe</a>\n              </td>\n            </tr>\n          </table>\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>{{first_name}}{{first_name}}{{first_name}}', NULL, NULL, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', NULL, '2026-09-09 13:00:18', '2026-09-09 13:03:31'),
('ec47c924-3e92-4f13-b72c-a3edadb26d3c', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Untitled template', 'general', '', NULL, '<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1f2937\">\n  <h1 style=\"font-size:24px;margin:0 0 16px\">Hello {{first_name | default: \"there\"}}</h1>\n  <p style=\"font-size:15px;line-height:1.6;margin:0 0 20px\">Write your message here.</p>\n  <a href=\"https://example.com\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600\">Call to action</a>\n</div>', NULL, NULL, '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '2026-09-09 15:07:29', '2026-09-09 13:03:36', '2026-09-09 15:07:29');

-- --------------------------------------------------------

--
-- Table structure for table `import_jobs`
--

CREATE TABLE `import_jobs` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `file_id` char(36) DEFAULT NULL,
  `list_id` char(36) DEFAULT NULL,
  `mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`mapping`)),
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `total_rows` int(11) NOT NULL DEFAULT 0,
  `valid_rows` int(11) NOT NULL DEFAULT 0,
  `invalid_rows` int(11) NOT NULL DEFAULT 0,
  `duplicate_rows` int(11) NOT NULL DEFAULT 0,
  `imported_rows` int(11) NOT NULL DEFAULT 0,
  `failed_rows` int(11) NOT NULL DEFAULT 0,
  `errors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`errors`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `plan_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `invoice_number` varchar(40) DEFAULT NULL,
  `gateway` enum('razorpay','manual') NOT NULL DEFAULT 'razorpay',
  `order_id` varchar(80) DEFAULT NULL,
  `payment_id` varchar(80) DEFAULT NULL,
  `refund_id` varchar(80) DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'INR',
  `billing_cycle` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
  `status` enum('created','pending','paid','failed','refunded') NOT NULL DEFAULT 'created',
  `method` varchar(40) DEFAULT NULL,
  `failure_reason` varchar(500) DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notes`)),
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `workspace_id`, `plan_id`, `user_id`, `invoice_number`, `gateway`, `order_id`, `payment_id`, `refund_id`, `amount`, `currency`, `billing_cycle`, `status`, `method`, `failure_reason`, `notes`, `paid_at`, `created_at`, `updated_at`) VALUES
('771cc999-ca04-4816-b4c3-b0dda98c57fc', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '9fff3bf9-ab7c-11f1-b05a-047c1686376e', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'MF/26-27/00001', 'razorpay', 'order_TZqsTDabDP2yO2', 'pay_TZqsnfWfFfxSj6', NULL, 799900, 'INR', 'monthly', 'paid', NULL, NULL, '{\"planSlug\":\"agency\",\"planName\":\"Agency\",\"receipt\":\"mf_mttrk6qb_7f48eb2d\"}', '2026-09-09 07:15:44', '2026-09-09 12:45:08', '2026-09-09 12:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(60) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'INR',
  `max_contacts` int(11) NOT NULL DEFAULT 1000,
  `max_emails_per_month` int(11) NOT NULL DEFAULT 5000,
  `max_campaigns_per_month` int(11) NOT NULL DEFAULT -1,
  `max_team_members` int(11) NOT NULL DEFAULT 2,
  `max_sender_identities` int(11) NOT NULL DEFAULT 1,
  `max_domains` int(11) NOT NULL DEFAULT 1,
  `ai_credits_per_day` int(11) NOT NULL DEFAULT 20,
  `allow_custom_smtp` tinyint(1) NOT NULL DEFAULT 0,
  `allow_api_access` tinyint(1) NOT NULL DEFAULT 0,
  `allow_ai` tinyint(1) NOT NULL DEFAULT 1,
  `allow_segments` tinyint(1) NOT NULL DEFAULT 1,
  `remove_branding` tinyint(1) NOT NULL DEFAULT 0,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `name`, `slug`, `description`, `price_monthly`, `price_yearly`, `currency`, `max_contacts`, `max_emails_per_month`, `max_campaigns_per_month`, `max_team_members`, `max_sender_identities`, `max_domains`, `ai_credits_per_day`, `allow_custom_smtp`, `allow_api_access`, `allow_ai`, `allow_segments`, `remove_branding`, `is_public`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
('9fff39f4-ab7c-11f1-b05a-047c1686376e', 'Free', 'free', 'Try MailFlow with a small list.', 0.00, 0.00, 'INR', 500, 2000, -1, 1, 1, 0, 10, 0, 0, 1, 0, 0, 1, 1, 1, '2026-09-08 17:28:37', '2026-09-08 17:28:37'),
('9fff3b0c-ab7c-11f1-b05a-047c1686376e', 'Starter', 'starter', 'For a single brand getting going.', 999.00, 9990.00, 'INR', 5000, 25000, -1, 3, 3, 1, 50, 0, 0, 1, 1, 1, 1, 1, 2, '2026-09-08 17:28:37', '2026-09-08 17:28:37'),
('9fff3bab-ab7c-11f1-b05a-047c1686376e', 'Growth', 'growth', 'Own SMTP, API access, bigger lists.', 2999.00, 29990.00, 'INR', 25000, 150000, -1, 10, 10, 5, 200, 1, 1, 1, 1, 1, 1, 1, 3, '2026-09-08 17:28:37', '2026-09-08 17:28:37'),
('9fff3bf9-ab7c-11f1-b05a-047c1686376e', 'Agency', 'agency', 'Unlimited sending for client work.', 7999.00, 79990.00, 'INR', -1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 4, '2026-09-08 17:28:37', '2026-09-08 17:28:37');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip`, `created_at`) VALUES
('0174c789-4056-44af-8a5f-f161b20ad6e8', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'daef7262f564ef40da5f38d576467dd632ceb2f43cb5ecb76a71c39bab5c6c57', '2026-10-09 06:07:50', '2026-09-09 06:08:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 11:37:50'),
('04bf3e33-9a46-417c-ad77-b7e43fae889f', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '46354660ba00575535ac26bb9a58e53e6371fab5f9394037f25fbec915658e18', '2026-10-09 09:46:40', '2026-09-09 10:01:50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 15:16:40'),
('1103000b-f7ec-4267-9b98-ee8fc0066da7', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '499f72cea0ad43f86dd8868021af64bc6532220bcb078210792fe2333b8e01f7', '2026-10-09 10:03:21', '2026-09-09 10:18:24', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 15:33:21'),
('2e4b2770-c9a3-4d9a-8097-0011433677dc', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'b762e2f838ca4596fd68002ad75df7f0dc6c74d0f61e467b29fc14feba1ef973', '2026-10-09 11:33:51', '2026-09-09 12:21:57', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 17:03:51'),
('31e73ad0-1b10-48a8-a467-a6457f76a185', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'e0c84afe9f2ab964afb2d292813cc16f51317489af199a2dd57cfbe3a43fd9c2', '2026-10-09 10:34:10', '2026-09-09 10:49:58', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 16:04:10'),
('52d21d0d-860c-48f2-8d40-a9593067d06c', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '70022246796b4ead3a72d33f76a66db19eb9fd2aa0435d685dde0c826d51ce7e', '2026-10-09 06:29:21', '2026-09-09 07:06:44', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 11:59:21'),
('57123189-af16-472d-ac77-8b6fc8e13e0c', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'ed7e20099844c58b823b56ecfc8394ae9b9663f3a8ea898cc9f00284e9e6e85c', '2026-10-09 09:29:00', '2026-09-09 09:46:40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 14:59:00'),
('650ca12f-9734-4626-83fa-f741a2dd61d9', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'c682df2f246aa62d3ed59820735f5a5bf1d01f8170ee37b5f028461b59310ab3', '2026-10-09 10:49:58', '2026-09-09 11:14:51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 16:19:58'),
('6e08fb09-3dcf-4812-8349-eff43a52b3bc', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '9781d55bae24fac7f8c641b54deb8b9891cb0b74b3d360236b982d7b1ad73d60', '2026-10-09 07:06:44', '2026-09-09 07:30:17', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 12:36:44'),
('7c29c9c9-d039-4c09-a263-3a93a4f3efdd', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'd89c986a4ec152941faba62cdc63b82e2addce8343a51b962ef7100a6b141a09', '2026-10-09 10:01:50', '2026-09-09 10:03:04', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 15:31:50'),
('80536133-6093-433b-94e1-7c5fd5bf77a8', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '00edb4de9e9d2164c048390b5e88bbe5d2e8d8c0dfeef1a15978e268dab126fc', '2026-10-09 07:30:17', '2026-09-09 08:22:38', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 13:00:17'),
('8e4dd205-0f91-4dc6-b35f-23c7229ad970', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '9151ee0de3209b9895c1309d80e449e2bfadd7e896f8e57cfc7ed997e1661c98', '2026-10-09 08:22:38', '2026-09-09 09:08:03', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 13:52:38'),
('93061493-aac8-4049-bbfb-dbc9e83775aa', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '4042b0e46bf368d4aafc16375a206a6e0dfa02211e9a0b388e8bc67229e53c27', '2026-10-09 06:11:37', '2026-09-09 06:29:21', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 11:41:37'),
('b15bd1a9-206b-4e70-90ff-6ea1d281f800', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'cefd4c94c24cdc7919ee3fea7ea18b5a072aa1061fe52f8d8f5364758060af42', '2026-10-09 12:21:57', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 17:51:57'),
('b174e673-7b41-418a-bb1b-7ca3e605d553', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '195c813026c3e9df34f32b7ae7c1b1c0afc5e1a0c216bb3f601963c544016cc0', '2026-10-09 06:13:37', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 11:43:37'),
('eb760388-59c3-4751-85f2-6ecb75e341a1', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', '7e73e8bd402a8d54473f14d8249be945278cbc22288b2c32ad78715cdd27c2b7', '2026-10-09 09:08:03', '2026-09-09 09:29:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 14:38:03'),
('ec855176-3b04-4118-a780-7304fa54ec42', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'f62e11ca9ac07a2aaf26e146209159727bf20bdad9e95bf389890bc3ce7bb008', '2026-10-09 10:18:24', '2026-09-09 10:34:10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 15:48:24'),
('f8f42745-dd84-4acc-9e07-1cf329f1a84c', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'b0feb18c48a4f25610f5cca14813ea7f00b3654fbd3e0e94071f7c6558d3f046', '2026-10-09 11:14:51', '2026-09-09 11:33:51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-09-09 16:44:51');

-- --------------------------------------------------------

--
-- Table structure for table `segments`
--

CREATE TABLE `segments` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `match_type` enum('all','any') NOT NULL DEFAULT 'all',
  `rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`rules`)),
  `cached_count` int(11) DEFAULT NULL,
  `cached_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sender_domains`
--

CREATE TABLE `sender_domains` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `provider` varchar(50) NOT NULL DEFAULT 'smtp',
  `verification_status` enum('pending','verifying','verified','failed') NOT NULL DEFAULT 'pending',
  `verification_records` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`verification_records`)),
  `last_checked_at` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dkim_selector` varchar(50) NOT NULL DEFAULT 'mailflow',
  `dkim_private_key_enc` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sender_domains`
--

INSERT INTO `sender_domains` (`id`, `workspace_id`, `domain`, `provider`, `verification_status`, `verification_records`, `last_checked_at`, `verified_at`, `created_at`, `updated_at`, `dkim_selector`, `dkim_private_key_enc`) VALUES
('b33c4660-5de8-4ad8-8531-68804321cdf0', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'hoverbusinessservices.in', 'smtp', 'verified', '[{\"type\":\"TXT\",\"host\":\"hoverbusinessservices.in\",\"value\":\"v=spf1 a mx ~all\",\"purpose\":\"spf\"},{\"type\":\"TXT\",\"host\":\"mailflow._domainkey.hoverbusinessservices.in\",\"value\":\"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTuSdih0SGslblylYWHyribS3lItmcnL5H5Ex0092Bvlhe5NGJRHJa10wKrffbJ1lAgY5t/M4khgmDquBL4i0omwepgZTavXwFN7uBXpeC8hKEWrJP+zSjq8LK9CYjOYJ6p950xtqxpbG4WeSmFKiCijp8aGN9uap252MNN2fBbwIDAQAB\",\"purpose\":\"dkim\"},{\"type\":\"TXT\",\"host\":\"_dmarc.hoverbusinessservices.in\",\"value\":\"v=DMARC1; p=none; rua=mailto:dmarc@hoverbusinessservices.in\",\"purpose\":\"dmarc\"}]', '2026-09-09 11:34:15', '2026-09-09 11:34:15', '2026-09-09 15:29:28', '2026-09-09 17:04:15', 'mailflow', 'v1.1sp0vgC02AiLngx7.wo2P3G9LnMy2jmRYF30bMQ==.A+kNjiUe71dmTONbLHE9161eZ/gIJeZ/3ru+4kJtbTAyi/cjfZsDSYnv7Ez5YrdI3G6VNledycHsmRrI8OjQT5HLsJCCUBQYzAvRYCuhW/ns1ENOfmisgfZJzrR5GOhjU6yXZ1bvoOr+XhguavmD66Uc3Ysv9TMd6bzjv/WKO3SE5zDFra68vw+2wh2IgRC4LAMv2P3DL7xU3bivdyW7e5gMg7jzR5NLpmF/a4eDYBBkgAnMF2lT53LAgyai1fqE40EN732mGPi8qIyVu4OV0U4toezqFWx9iRCo3MH0qjTSvufqDDHqY54bGAzEhEyMpDyEwpzY0kl4Gb6CU8mKDvmr7Imq7nqVzh5zi9Z3CVKfCNtHG+9nPTRstgkcsoPNs9GsDYHntyMozofp4aJMxfs1uxRLTRnOVwewDmFkVfH2pBtGWd5dDj7P23xDkcmA7yRpylJloGx7WjeRNn1jh+PpXcX8Wa7jaeWGPxFIwUrgRS3VIXo9gGWeg/3s6DfY++eZ0leCPUSkhfggG5wKYQoUID3MOPHzy6dOGCGgA7aTzOb3vNbWzkygBETEyPQXDulCaRvWWblTl7IHDX5JToo6TuBC7CwKxZHO9CHKWm2BHEtGYwk+LOaeH1pAh5TWIjt22V7ITdmGcACM+qUMljh0sDGby/5vm2F0I7QsjoInjc8sibITfEoFKHdr4tiULVkjFMrK1eoxpAV690WmUpaRhmxofm3S8wBTx2tw3QP3h9HdJazD8tx/Wdk2nfOnA+oBIIFa2ljs3RQVwO71Acu99zC0wfxIyHgPX94Mn5JQy6kRfCtVct2ArlM0dOZiOry6bHKq4IvNPLIx8wJRxEW+YBgjH1zFQBIqW4MLwdHh7NA6sP+alFlHXWNejtGR4IX/tAYan04MPB6T7UDNweMwuUtqrZjCCLNgSlWASZYODtNc3HR0zcySmcKn1Ta0pOWhj/6yzehUA0WkSgdFmwpPyrzrR/oJTMTbrBXfWXttwW/ZnqEK2SczDUGYNPC+a8asSb8OE7FK12f/4EOW1j/CbQnPauafMeUOIms4HBIxQTV0hFb5EYnIN4YHFzrm8EXkVt+sPjE5955/demqYe6NTROaYa+t+tD8mBeb+zD6xH2dXqpEc1AkmjSWhIqLsZkhNq5A2H+5ExQSRXlw1lwHg3c5syZ9UrlVj2ncXJkyfoR7UzhxtnyiDEFo89nz');

-- --------------------------------------------------------

--
-- Table structure for table `sender_identities`
--

CREATE TABLE `sender_identities` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `from_name` varchar(150) NOT NULL,
  `from_email` varchar(255) NOT NULL,
  `reply_to_email` varchar(255) DEFAULT NULL,
  `status` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
  `verification_token` varchar(128) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sender_identities`
--

INSERT INTO `sender_identities` (`id`, `workspace_id`, `from_name`, `from_email`, `reply_to_email`, `status`, `verification_token`, `verified_at`, `is_default`, `created_at`, `updated_at`) VALUES
('c994e4e9-9d36-4a8c-8cf3-4553d5dd304d', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'Hover Media', 'support@hoverbusinessservices.in', 'support@hoverbusinessservices.in', 'verified', NULL, '2026-09-09 09:31:43', 0, '2026-09-09 14:45:59', '2026-09-09 15:01:43');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `plan_id` char(36) NOT NULL,
  `status` enum('trialing','active','past_due','cancelled','suspended') NOT NULL DEFAULT 'active',
  `billing_cycle` enum('monthly','yearly','lifetime','free') NOT NULL DEFAULT 'monthly',
  `current_period_start` datetime NOT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `overrides` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`overrides`)),
  `notes` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `workspace_id`, `plan_id`, `status`, `billing_cycle`, `current_period_start`, `current_period_end`, `trial_ends_at`, `cancelled_at`, `overrides`, `notes`, `created_at`, `updated_at`) VALUES
('053cea5e-c095-4b95-b65c-74fd30d352b8', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '9fff3bf9-ab7c-11f1-b05a-047c1686376e', 'active', 'monthly', '2026-09-09 07:15:44', '2026-10-09 07:15:44', NULL, NULL, NULL, NULL, '2026-09-09 11:41:54', '2026-09-09 12:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `suppressions`
--

CREATE TABLE `suppressions` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `reason` enum('unsubscribe','hard_bounce','complaint','manual') NOT NULL,
  `source` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppressions`
--

INSERT INTO `suppressions` (`id`, `workspace_id`, `email`, `reason`, `source`, `created_at`) VALUES
('ff96dfba-e801-41d9-a6bb-bdee9cf4acde', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'hbsdevelopersteam@gmail.com', 'unsubscribe', 'link', '2026-09-09 16:00:58');

-- --------------------------------------------------------

--
-- Table structure for table `tracked_links`
--

CREATE TABLE `tracked_links` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `campaign_id` char(36) NOT NULL,
  `url` varchar(2048) NOT NULL,
  `url_hash` char(64) NOT NULL,
  `label` varchar(255) DEFAULT NULL,
  `total_clicks` int(11) NOT NULL DEFAULT 0,
  `unique_clicks` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tracked_links`
--

INSERT INTO `tracked_links` (`id`, `workspace_id`, `campaign_id`, `url`, `url_hash`, `label`, `total_clicks`, `unique_clicks`, `created_at`) VALUES
('129048bd-727d-48c4-9a7f-2baf0c73fccb', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '1b60de77-d841-4c80-bbaa-0ba5cf583c20', 'https://example.com/get-started', '6b0dc5b522da022cfe70ad1f8e0700e4686a1b58ce8485340d5f7910d46745ed', NULL, 1, 1, '2026-09-09 15:48:38'),
('58aa3e50-66d4-4a61-9bb3-8679e574b440', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'b6844f88-c7a4-4cd1-82a9-fc999a4f8e14', 'https://example.com/get-started', '6b0dc5b522da022cfe70ad1f8e0700e4686a1b58ce8485340d5f7910d46745ed', NULL, 2, 1, '2026-09-09 15:26:35'),
('a07e9348-dfec-49e5-af9a-78cc8e3fe740', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'e56170cb-ddc1-4eb7-8c5d-4f89f447d587', 'https://example.com/get-started', '6b0dc5b522da022cfe70ad1f8e0700e4686a1b58ce8485340d5f7910d46745ed', NULL, 0, 0, '2026-09-09 15:10:14');

-- --------------------------------------------------------

--
-- Table structure for table `unsubscribes`
--

CREATE TABLE `unsubscribes` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `contact_id` char(36) DEFAULT NULL,
  `campaign_id` char(36) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `unsubscribes`
--

INSERT INTO `unsubscribes` (`id`, `workspace_id`, `contact_id`, `campaign_id`, `email`, `reason`, `ip`, `created_at`) VALUES
('a792501b-c8f3-468e-916e-d383a21146e7', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '95b19acf-d856-46ee-a46e-730ba46dfd9c', NULL, 'hbsdevelopersteam@gmail.com', NULL, '::1', '2026-09-09 16:00:58');

-- --------------------------------------------------------

--
-- Table structure for table `uploaded_files`
--

CREATE TABLE `uploaded_files` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `storage_key` varchar(500) NOT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `size_bytes` bigint(20) NOT NULL DEFAULT 0,
  `purpose` varchar(50) NOT NULL DEFAULT 'image',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `uploaded_files`
--

INSERT INTO `uploaded_files` (`id`, `workspace_id`, `uploaded_by`, `file_name`, `storage_key`, `url`, `mime_type`, `size_bytes`, `purpose`, `created_at`) VALUES
('875ba52c-dc77-48aa-a70c-0d6267376628', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'dummy-image.jpg', '7f48eb2d-baf2-491e-9c8d-3d36b8970549/email-image/ca1dfdbd-d7bb-473e-bb3a-733233b0cb9c-dummy-image.jpg', 'https://pub-ffbe8ee01a4b4b48a72eb48cb0792ea1.r2.dev/7f48eb2d-baf2-491e-9c8d-3d36b8970549/email-image/ca1dfdbd-d7bb-473e-bb3a-733233b0cb9c-dummy-image.jpg', 'image/jpeg', 24675, 'email-image', '2026-09-09 16:11:50');

-- --------------------------------------------------------

--
-- Table structure for table `usage_periods`
--

CREATE TABLE `usage_periods` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `period` char(7) NOT NULL,
  `emails_sent` int(11) NOT NULL DEFAULT 0,
  `campaigns_created` int(11) NOT NULL DEFAULT 0,
  `contacts_imported` int(11) NOT NULL DEFAULT 0,
  `ai_calls` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usage_periods`
--

INSERT INTO `usage_periods` (`id`, `workspace_id`, `period`, `emails_sent`, `campaigns_created`, `contacts_imported`, `ai_calls`, `created_at`, `updated_at`) VALUES
('13edbe6d-b27a-4429-8ce8-950dfb51ea3a', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '2026-09', 7, 1, 0, 2, '2026-09-09 11:42:05', '2026-09-09 15:48:41');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(128) DEFAULT NULL,
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_token_expires_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_super_admin` tinyint(1) NOT NULL DEFAULT 0,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `admin_permissions` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `email_verified`, `verification_token`, `reset_token`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`, `is_super_admin`, `must_change_password`, `created_by`) VALUES
('7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'hbsdevelopersteam@gmail.com', '$2b$12$EBRonLS.RAaHLHxhQTX3YucwtBjnXEUjlgP4uf1r0rVLmpqIh6g7C', 'Hover', 'Business', 1, '984bdd1ba5d56b5d8101276b47b53b745560b7a8719787c2', NULL, NULL, '2026-09-09 10:03:21', '2026-09-09 11:37:50', '2026-09-09 15:33:21', 1, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `workspaces`
--

CREATE TABLE `workspaces` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `owner_id` char(36) NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
  `plan` varchar(50) NOT NULL DEFAULT 'free',
  `ai_daily_limit` int(11) NOT NULL DEFAULT 200,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','suspended') NOT NULL DEFAULT 'active',
  `billing_name` varchar(200) DEFAULT NULL,
  `billing_email` varchar(255) DEFAULT NULL,
  `billing_address` varchar(500) DEFAULT NULL,
  `billing_gstin` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workspaces`
--

INSERT INTO `workspaces` (`id`, `name`, `slug`, `owner_id`, `timezone`, `plan`, `ai_daily_limit`, `deleted_at`, `created_at`, `updated_at`, `status`, `billing_name`, `billing_email`, `billing_address`, `billing_gstin`) VALUES
('7f48eb2d-baf2-491e-9c8d-3d36b8970549', 'CodeWins', 'codewins-e22e84', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'Asia/Kolkata', 'free', 200, NULL, '2026-09-09 11:37:50', '2026-09-09 11:37:50', 'active', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `workspace_members`
--

CREATE TABLE `workspace_members` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  `invited_email` varchar(255) DEFAULT NULL,
  `invite_token` varchar(128) DEFAULT NULL,
  `status` enum('active','invited','disabled') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workspace_members`
--

INSERT INTO `workspace_members` (`id`, `workspace_id`, `user_id`, `role`, `invited_email`, `invite_token`, `status`, `created_at`, `updated_at`) VALUES
('f7c7d1dd-16c4-4506-a25e-a84d99f040eb', '7f48eb2d-baf2-491e-9c8d-3d36b8970549', '7d4ec52b-3ce2-4b5a-8216-4bbcc18c3f9c', 'owner', NULL, NULL, 'active', '2026-09-09 11:37:50', '2026-09-09 11:37:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_usage`
--
ALTER TABLE `ai_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ai_ws_date` (`workspace_id`,`created_at`);

--
-- Indexes for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ak_ws` (`workspace_id`),
  ADD KEY `idx_ak_prefix` (`key_prefix`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_al_ws` (`workspace_id`,`created_at`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cp_sender` (`sender_identity_id`),
  ADD KEY `fk_cp_tpl` (`template_id`),
  ADD KEY `idx_cp_ws_status` (`workspace_id`,`status`),
  ADD KEY `idx_cp_scheduled` (`scheduled_at`);

--
-- Indexes for table `campaign_events`
--
ALTER TABLE `campaign_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_dedupe` (`dedupe_key`),
  ADD KEY `idx_ce_campaign_type` (`campaign_id`,`event_type`),
  ADD KEY `idx_ce_recipient` (`campaign_recipient_id`),
  ADD KEY `idx_ce_contact` (`contact_id`),
  ADD KEY `idx_ce_created` (`created_at`);

--
-- Indexes for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cr_campaign_contact` (`campaign_id`,`contact_id`),
  ADD KEY `idx_cr_campaign_status` (`campaign_id`,`status`),
  ADD KEY `idx_cr_contact` (`contact_id`),
  ADD KEY `idx_cr_email` (`email`),
  ADD KEY `idx_cr_msgid` (`message_id`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_contact_ws_email` (`workspace_id`,`email`),
  ADD KEY `idx_ct_ws_status` (`workspace_id`,`status`),
  ADD KEY `idx_ct_created` (`workspace_id`,`created_at`);

--
-- Indexes for table `contact_lists`
--
ALTER TABLE `contact_lists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cl_ws` (`workspace_id`);

--
-- Indexes for table `contact_list_members`
--
ALTER TABLE `contact_list_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_list_contact` (`list_id`,`contact_id`),
  ADD KEY `idx_clm_contact` (`contact_id`);

--
-- Indexes for table `email_connections`
--
ALTER TABLE `email_connections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_mailconn_ws` (`workspace_id`);

--
-- Indexes for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tpl_ws` (`workspace_id`,`category`);

--
-- Indexes for table `import_jobs`
--
ALTER TABLE `import_jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ij_ws` (`workspace_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payment_order` (`order_id`),
  ADD UNIQUE KEY `uq_payment_invoice` (`invoice_number`),
  ADD KEY `idx_payment_ws` (`workspace_id`,`created_at`),
  ADD KEY `idx_payment_status` (`status`),
  ADD KEY `idx_payment_payment_id` (`payment_id`),
  ADD KEY `fk_payment_plan` (`plan_id`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_plan_slug` (`slug`),
  ADD KEY `idx_plan_public` (`is_public`,`is_active`,`sort_order`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rt_user` (`user_id`),
  ADD KEY `idx_rt_hash` (`token_hash`);

--
-- Indexes for table `segments`
--
ALTER TABLE `segments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sg_ws` (`workspace_id`);

--
-- Indexes for table `sender_domains`
--
ALTER TABLE `sender_domains`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_domain_ws` (`workspace_id`,`domain`);

--
-- Indexes for table `sender_identities`
--
ALTER TABLE `sender_identities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sender_ws_email` (`workspace_id`,`from_email`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sub_workspace` (`workspace_id`),
  ADD KEY `idx_sub_plan` (`plan_id`),
  ADD KEY `idx_sub_status` (`status`);

--
-- Indexes for table `suppressions`
--
ALTER TABLE `suppressions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sup_ws_email` (`workspace_id`,`email`);

--
-- Indexes for table `tracked_links`
--
ALTER TABLE `tracked_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tl_campaign_url` (`campaign_id`,`url_hash`);

--
-- Indexes for table `unsubscribes`
--
ALTER TABLE `unsubscribes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_un_ws_email` (`workspace_id`,`email`);

--
-- Indexes for table `uploaded_files`
--
ALTER TABLE `uploaded_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_uf_ws` (`workspace_id`,`purpose`);

--
-- Indexes for table `usage_periods`
--
ALTER TABLE `usage_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usage_ws_period` (`workspace_id`,`period`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_reset` (`reset_token`);

--
-- Indexes for table `workspaces`
--
ALTER TABLE `workspaces`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_ws_owner` (`owner_id`);

--
-- Indexes for table `workspace_members`
--
ALTER TABLE `workspace_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ws_user` (`workspace_id`,`user_id`),
  ADD KEY `idx_wm_user` (`user_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD CONSTRAINT `fk_ak_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD CONSTRAINT `fk_cp_sender` FOREIGN KEY (`sender_identity_id`) REFERENCES `sender_identities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cp_tpl` FOREIGN KEY (`template_id`) REFERENCES `email_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cp_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `campaign_events`
--
ALTER TABLE `campaign_events`
  ADD CONSTRAINT `fk_ce_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD CONSTRAINT `fk_cr_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cr_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `fk_ct_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contact_lists`
--
ALTER TABLE `contact_lists`
  ADD CONSTRAINT `fk_cl_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contact_list_members`
--
ALTER TABLE `contact_list_members`
  ADD CONSTRAINT `fk_clm_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_clm_list` FOREIGN KEY (`list_id`) REFERENCES `contact_lists` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `email_connections`
--
ALTER TABLE `email_connections`
  ADD CONSTRAINT `fk_mailconn_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD CONSTRAINT `fk_tpl_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `import_jobs`
--
ALTER TABLE `import_jobs`
  ADD CONSTRAINT `fk_ij_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`),
  ADD CONSTRAINT `fk_payment_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `segments`
--
ALTER TABLE `segments`
  ADD CONSTRAINT `fk_sg_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sender_domains`
--
ALTER TABLE `sender_domains`
  ADD CONSTRAINT `fk_sd_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sender_identities`
--
ALTER TABLE `sender_identities`
  ADD CONSTRAINT `fk_si_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`),
  ADD CONSTRAINT `fk_sub_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `suppressions`
--
ALTER TABLE `suppressions`
  ADD CONSTRAINT `fk_sup_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tracked_links`
--
ALTER TABLE `tracked_links`
  ADD CONSTRAINT `fk_tl_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `uploaded_files`
--
ALTER TABLE `uploaded_files`
  ADD CONSTRAINT `fk_uf_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `usage_periods`
--
ALTER TABLE `usage_periods`
  ADD CONSTRAINT `fk_usage_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workspaces`
--
ALTER TABLE `workspaces`
  ADD CONSTRAINT `fk_ws_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `workspace_members`
--
ALTER TABLE `workspace_members`
  ADD CONSTRAINT `fk_wm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wm_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
