CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`group` text NOT NULL,
	`balance` text DEFAULT '0' NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`original_amount` text,
	`interest_rate` text,
	`next_payment_date` text,
	`linked_account_id` text,
	`color` text,
	`icon` text,
	`is_active` integer DEFAULT true NOT NULL,
	`include_in_net_worth` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_profile_idx` ON `accounts` (`profile_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`icon` text,
	`color` text,
	`parent_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `categories_profile_idx` ON `categories` (`profile_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`type` text DEFAULT 'PERSONAL' NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`date_format` text DEFAULT 'D MMM, YYYY' NOT NULL,
	`week_start` text DEFAULT 'MONDAY' NOT NULL,
	`timezone` text DEFAULT 'America/Toronto' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_setup_complete` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "profiles_notes_length_chk" CHECK(("profiles"."notes" is null or length("profiles"."notes") <= 160))
);
--> statement-breakpoint
CREATE INDEX `profiles_default_idx` ON `profiles` (`is_default`);--> statement-breakpoint
CREATE INDEX `profiles_active_idx` ON `profiles` (`is_active`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text,
	`type` text NOT NULL,
	`amount` text NOT NULL,
	`description` text,
	`notes` text,
	`date` text NOT NULL,
	`transfer_id` text,
	`is_cleared` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transactions_profile_idx` ON `transactions` (`profile_id`);--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_transfer_idx` ON `transactions` (`transfer_id`);