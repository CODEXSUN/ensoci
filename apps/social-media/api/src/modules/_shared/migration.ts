import { sql } from "kysely";
import type { Kysely } from "kysely";
import type { MigrationBatch } from "@cxapp/framework/db";

export const socialMediaMigration: MigrationBatch = {
  version: 1,
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable("social_accounts")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (col) => col.notNull())
      .addColumn("tenant_id", "varchar(36)", (col) => col.notNull())
      .addColumn("platform", "varchar(20)", (col) => col.notNull())
      .addColumn("platform_user_id", "varchar(255)", (col) => col.notNull())
      .addColumn("display_name", "varchar(255)", (col) => col.notNull())
      .addColumn("username", "varchar(255)", (col) => col.notNull())
      .addColumn("avatar_url", "text")
      .addColumn("access_token", "text", (col) => col.notNull())
      .addColumn("refresh_token", "text")
      .addColumn("token_expires_at", "timestamp")
      .addColumn("scopes", "json")
      .addColumn("status", "varchar(20)", (col) => col.notNull().defaultTo("active"))
      .addColumn("last_synced_at", "timestamp")
      .addColumn("deleted_at", "timestamp")
      .addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn("updated_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .execute();

    await db.schema
      .createTable("social_posts")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (col) => col.notNull())
      .addColumn("tenant_id", "varchar(36)", (col) => col.notNull())
      .addColumn("title", "varchar(255)")
      .addColumn("content", "text", (col) => col.notNull())
      .addColumn("type", "varchar(20)", (col) => col.notNull().defaultTo("text"))
      .addColumn("status", "varchar(20)", (col) => col.notNull().defaultTo("draft"))
      .addColumn("scheduled_at", "timestamp")
      .addColumn("published_at", "timestamp")
      .addColumn("failure_reason", "text")
      .addColumn("retry_count", "int", (col) => col.notNull().defaultTo(0))
      .addColumn("max_retries", "int", (col) => col.notNull().defaultTo(3))
      .addColumn("created_by", "varchar(255)", (col) => col.notNull())
      .addColumn("deleted_at", "timestamp")
      .addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn("updated_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .execute();

    await db.schema
      .createTable("social_post_media")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (col) => col.notNull())
      .addColumn("post_id", "bigint", (col) => col.notNull())
      .addColumn("url", "text", (col) => col.notNull())
      .addColumn("type", "varchar(20)", (col) => col.notNull())
      .addColumn("file_name", "varchar(255)", (col) => col.notNull())
      .addColumn("file_size", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("width", "int")
      .addColumn("height", "int")
      .addColumn("duration", "int")
      .addColumn("alt_text", "text")
      .addColumn("sort_order", "int", (col) => col.notNull().defaultTo(0))
      .addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addForeignKeyConstraint("fk_post_media_post", ["post_id"], "social_posts", ["id"])
      .execute();

    await db.schema
      .createTable("social_post_platforms")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("post_id", "bigint", (col) => col.notNull())
      .addColumn("account_id", "bigint", (col) => col.notNull())
      .addColumn("platform", "varchar(20)", (col) => col.notNull())
      .addColumn("platform_post_id", "varchar(255)")
      .addColumn("status", "varchar(20)", (col) => col.notNull().defaultTo("draft"))
      .addColumn("published_at", "timestamp")
      .addColumn("failure_reason", "text")
      .addColumn("platform_response", "json")
      .addForeignKeyConstraint("fk_post_platforms_post", ["post_id"], "social_posts", ["id"])
      .addForeignKeyConstraint("fk_post_platforms_account", ["account_id"], "social_accounts", ["id"])
      .execute();

    await db.schema
      .createTable("social_schedules")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (col) => col.notNull())
      .addColumn("tenant_id", "varchar(36)", (col) => col.notNull())
      .addColumn("post_id", "bigint", (col) => col.notNull())
      .addColumn("scheduled_at", "timestamp", (col) => col.notNull())
      .addColumn("timezone", "varchar(50)", (col) => col.notNull().defaultTo("UTC"))
      .addColumn("status", "varchar(20)", (col) => col.notNull().defaultTo("pending"))
      .addColumn("processed_at", "timestamp")
      .addColumn("failure_reason", "text")
      .addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn("updated_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addForeignKeyConstraint("fk_schedule_post", ["post_id"], "social_posts", ["id"])
      .execute();

    await db.schema
      .createTable("social_analytics")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (col) => col.notNull())
      .addColumn("account_id", "bigint", (col) => col.notNull())
      .addColumn("post_id", "bigint")
      .addColumn("platform", "varchar(20)", (col) => col.notNull())
      .addColumn("period", "varchar(20)", (col) => col.notNull().defaultTo("day"))
      .addColumn("date", "date", (col) => col.notNull())
      .addColumn("impressions", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("reach", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("engagement", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("likes", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("comments", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("shares", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("saves", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("clicks", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("followers", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("followers_growth", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("profile_views", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("website_clicks", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("video_views", "bigint", (col) => col.notNull().defaultTo(0))
      .addColumn("avg_watch_time", "int")
      .addColumn("sentiment", "decimal(3,2)")
      .addColumn("raw_metrics", "json")
      .addColumn("collected_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addForeignKeyConstraint("fk_analytics_account", ["account_id"], "social_accounts", ["id"])
      .addForeignKeyConstraint("fk_analytics_post", ["post_id"], "social_posts", ["id"])
      .execute();

    await db.schema
      .createTable("social_templates")
      .addColumn("id", "bigint", (col) => col.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (col) => col.notNull())
      .addColumn("tenant_id", "varchar(36)", (col) => col.notNull())
      .addColumn("name", "varchar(255)", (col) => col.notNull())
      .addColumn("description", "text")
      .addColumn("content", "text", (col) => col.notNull())
      .addColumn("type", "varchar(20)", (col) => col.notNull().defaultTo("text"))
      .addColumn("platforms", "json", (col) => col.notNull())
      .addColumn("media", "json")
      .addColumn("tags", "json")
      .addColumn("is_public", "boolean", (col) => col.notNull().defaultTo(false))
      .addColumn("created_by", "varchar(255)", (col) => col.notNull())
      .addColumn("deleted_at", "timestamp")
      .addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn("updated_at", "timestamp", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
      .execute();

    await db.schema
      .createIndex("idx_social_accounts_tenant")
      .on("social_accounts")
      .column("tenant_id")
      .execute();

    await db.schema
      .createIndex("idx_social_accounts_platform")
      .on("social_accounts")
      .columns(["tenant_id", "platform"])
      .execute();

    await db.schema
      .createIndex("idx_social_posts_tenant")
      .on("social_posts")
      .column("tenant_id")
      .execute();

    await db.schema
      .createIndex("idx_social_posts_status")
      .on("social_posts")
      .columns(["tenant_id", "status"])
      .execute();

    await db.schema
      .createIndex("idx_social_posts_scheduled")
      .on("social_posts")
      .columns(["tenant_id", "scheduled_at"])
      .execute();

    await db.schema
      .createIndex("idx_social_schedules_tenant")
      .on("social_schedules")
      .column("tenant_id")
      .execute();

    await db.schema
      .createIndex("idx_social_schedules_pending")
      .on("social_schedules")
      .columns(["tenant_id", "status", "scheduled_at"])
      .execute();

    await db.schema
      .createIndex("idx_social_analytics_account")
      .on("social_analytics")
      .columns(["account_id", "date"])
      .execute();

    await db.schema
      .createIndex("idx_social_templates_tenant")
      .on("social_templates")
      .column("tenant_id")
      .execute();
  },

  async down(db: Kysely<unknown>) {
    await db.schema.dropTable("social_templates").execute();
    await db.schema.dropTable("social_analytics").execute();
    await db.schema.dropTable("social_schedules").execute();
    await db.schema.dropTable("social_post_platforms").execute();
    await db.schema.dropTable("social_post_media").execute();
    await db.schema.dropTable("social_posts").execute();
    await db.schema.dropTable("social_accounts").execute();
  }
};
