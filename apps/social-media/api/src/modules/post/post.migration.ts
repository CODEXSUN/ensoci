import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function runPostMigration(db: Kysely<unknown>): Promise<void> {
  const tableCheck = await db
    .selectFrom("information_schema.tables" as never)
    .select("table_name")
    .where("table_name", "=", "social_posts")
    .executeTakeFirst();

  if (!tableCheck) {
    await sql`
      CREATE TABLE social_posts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) NOT NULL,
        tenant_id VARCHAR(36) NOT NULL,
        title VARCHAR(255),
        content TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'text',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        scheduled_at TIMESTAMP NULL,
        published_at TIMESTAMP NULL,
        failure_reason TEXT,
        retry_count INT NOT NULL DEFAULT 0,
        max_retries INT NOT NULL DEFAULT 3,
        created_by VARCHAR(255) NOT NULL,
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_social_posts_tenant (tenant_id),
        INDEX idx_social_posts_status (tenant_id, status),
        INDEX idx_social_posts_scheduled (tenant_id, scheduled_at)
      )
    `.execute(db);
  }
}
