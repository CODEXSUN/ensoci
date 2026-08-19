import type { Kysely } from "kysely";
import type { SocialSchedule, ScheduleStatus } from "../_shared/types.js";

export class SocialScheduleRepository {
  constructor(private readonly db: Kysely<unknown>) {}

  async list(
    tenantId: string,
    filters?: { status?: ScheduleStatus; from?: string; to?: string; limit?: number; offset?: number }
  ): Promise<SocialSchedule[]> {
    let query = this.db
      .selectFrom("social_schedules" as never)
      .where("tenant_id", "=", tenantId);

    if (filters?.status) {
      query = query.where("status", "=", filters.status);
    }
    if (filters?.from) {
      query = query.where("scheduled_at", ">=", filters.from);
    }
    if (filters?.to) {
      query = query.where("scheduled_at", "<=", filters.to);
    }

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = await query
      .orderBy("scheduled_at", "asc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows as unknown as SocialSchedule[];
  }

  async findByUuid(uuid: string, tenantId: string): Promise<SocialSchedule | null> {
    const row = await this.db
      .selectFrom("social_schedules" as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .executeTakeFirst();

    return (row as unknown as SocialSchedule) ?? null;
  }

  async findByPost(postId: number): Promise<SocialSchedule[]> {
    const rows = await this.db
      .selectFrom("social_schedules" as never)
      .where("post_id", "=", postId)
      .orderBy("scheduled_at", "asc")
      .execute();

    return rows as unknown as SocialSchedule[];
  }

  async findPending(limit: number): Promise<SocialSchedule[]> {
    const now = new Date().toISOString();
    const rows = await this.db
      .selectFrom("social_schedules" as never)
      .where("status", "=", "pending")
      .where("scheduled_at", "<=", now)
      .orderBy("scheduled_at", "asc")
      .limit(limit)
      .execute();

    return rows as unknown as SocialSchedule[];
  }

  async create(
    tenantId: string,
    data: { postId: number; scheduledAt: string; timezone: string }
  ): Promise<SocialSchedule> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .insertInto("social_schedules" as never)
      .values({
        uuid,
        tenant_id: tenantId,
        post_id: data.postId,
        scheduled_at: data.scheduledAt,
        timezone: data.timezone,
        status: "pending",
        created_at: now,
        updated_at: now
      } as never)
      .execute();

    return this.findByUuid(uuid, tenantId) as Promise<SocialSchedule>;
  }

  async updateStatus(
    uuid: string,
    status: ScheduleStatus,
    failureReason?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .updateTable("social_schedules" as never)
      .set({
        status,
        processed_at: status === "completed" ? now : null,
        failure_reason: failureReason ?? null,
        updated_at: now
      } as never)
      .where("uuid", "=", uuid)
      .execute();
  }

  async cancel(uuid: string, tenantId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable("social_schedules" as never)
      .set({ status: "cancelled", updated_at: now } as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .where("status", "=", "pending")
      .execute();

    return result.numUpdatedRows > 0n;
  }

  async count(tenantId: string): Promise<Record<ScheduleStatus, number>> {
    const rows = await this.db
      .selectFrom("social_schedules" as never)
      .select(["status"])
      .select((eb) => eb.fn.count("id").as("count"))
      .where("tenant_id", "=", tenantId)
      .groupBy("status")
      .execute();

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[(row as Record<string, unknown>).status as string] = Number(
        (row as Record<string, unknown>).count
      );
    }
    return counts as Record<ScheduleStatus, number>;
  }

  async upcoming(tenantId: string, limit: number): Promise<SocialSchedule[]> {
    const now = new Date().toISOString();
    const rows = await this.db
      .selectFrom("social_schedules" as never)
      .where("tenant_id", "=", tenantId)
      .where("status", "=", "pending")
      .where("scheduled_at", ">", now)
      .orderBy("scheduled_at", "asc")
      .limit(limit)
      .execute();

    return rows as unknown as SocialSchedule[];
  }
}
