CREATE TABLE IF NOT EXISTS `sae_tasks` (
  `id` varchar(36) NOT NULL,
  `text` text NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `due_date` datetime DEFAULT NULL,
  `lead_id` varchar(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;