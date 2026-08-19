import type { Kysely } from "kysely";
import type {
  SocialAccount,
  SocialAccountCreatePayload,
  SocialAccountUpdatePayload,
  SocialPlatform,
  AccountStatus,
  SocialMediaRuntimeContext
} from "../_shared/types.js";

export class SocialAccountRepository {
  constructor(private readonly db: Kysely<unknown>) {}

  async list(tenantId: string, platform?: SocialPlatform): Promise<SocialAccount[]> {
    let query = this.db
      .selectFrom("social_accounts" as never)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null);

    if (platform) {
      query = query.where("platform", "=", platform);
    }

    const rows = await query.orderBy("created_at", "desc").execute();
    return rows as unknown as SocialAccount[];
  }

  async findByUuid(uuid: string, tenantId: string): Promise<SocialAccount | null> {
    const row = await this.db
      .selectFrom("social_accounts" as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    return (row as unknown as SocialAccount) ?? null;
  }

  async findByPlatformUser(
    platform: SocialPlatform,
    platformUserId: string,
    tenantId: string
  ): Promise<SocialAccount | null> {
    const row = await this.db
      .selectFrom("social_accounts" as never)
      .where("platform", "=", platform)
      .where("platform_user_id", "=", platformUserId)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    return (row as unknown as SocialAccount) ?? null;
  }

  async create(
    tenantId: string,
    payload: SocialAccountCreatePayload,
    createdBy: string
  ): Promise<SocialAccount> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .insertInto("social_accounts" as never)
      .values({
        uuid,
        tenant_id: tenantId,
        platform: payload.platform,
        platform_user_id: payload.platformUserId,
        display_name: payload.displayName,
        username: payload.username,
        avatar_url: payload.avatarUrl ?? null,
        access_token: payload.accessToken,
        refresh_token: payload.refreshToken ?? null,
        token_expires_at: payload.tokenExpiresAt ?? null,
        scopes: JSON.stringify(payload.scopes ?? []),
        status: "active",
        created_at: now,
        updated_at: now
      } as never)
      .execute();

    const account = await this.findByUuid(uuid, tenantId);
    return account!;
  }

  async update(
    uuid: string,
    tenantId: string,
    payload: SocialAccountUpdatePayload
  ): Promise<SocialAccount | null> {
    const existing = await this.findByUuid(uuid, tenantId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };

    if (payload.displayName !== undefined) updates.display_name = payload.displayName;
    if (payload.avatarUrl !== undefined) updates.avatar_url = payload.avatarUrl;
    if (payload.accessToken !== undefined) updates.access_token = payload.accessToken;
    if (payload.refreshToken !== undefined) updates.refresh_token = payload.refreshToken;
    if (payload.tokenExpiresAt !== undefined) updates.token_expires_at = payload.tokenExpiresAt;
    if (payload.scopes !== undefined) updates.scopes = JSON.stringify(payload.scopes);
    if (payload.status !== undefined) updates.status = payload.status;

    await this.db
      .updateTable("social_accounts" as never)
      .set(updates as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    return this.findByUuid(uuid, tenantId);
  }

  async disconnect(uuid: string, tenantId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable("social_accounts" as never)
      .set({ status: "disconnected", updated_at: now } as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    return result.numUpdatedRows > 0n;
  }

  async softDelete(uuid: string, tenantId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable("social_accounts" as never)
      .set({ deleted_at: now, updated_at: now } as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    return result.numUpdatedRows > 0n;
  }

  async count(tenantId: string): Promise<Record<SocialPlatform, number>> {
    const rows = await this.db
      .selectFrom("social_accounts" as never)
      .select(["platform"])
      .select((eb) => eb.fn.count("id").as("count"))
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .groupBy("platform")
      .execute();

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[(row as Record<string, unknown>).platform as string] = Number(
        (row as Record<string, unknown>).count
      );
    }
    return counts as Record<SocialPlatform, number>;
  }
}
