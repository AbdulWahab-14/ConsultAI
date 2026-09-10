CREATE TABLE `admin_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`record_id` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`object_key` text NOT NULL,
	`review` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `documents_owner` ON `documents` (`owner`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`content_hash` text NOT NULL,
	`text` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_by` text
);
--> statement-breakpoint
CREATE INDEX `source_versions_url` ON `source_versions` (`url`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`updated_at` text NOT NULL
);
