import type { Kysely } from "kysely";
import type {
  SocialPost,
  PostStatus,
  PostType,
  PostMedia,
  PostPlatformTarget
} from "../_shared/types.js";

export class SocialPostRepository {
  constructor(private readonly db: Kysely<unknown>) {}

  async list(
    tenantId: string,
    filters?: { status?: PostStatus; type?: PostType; search?: string; limit?: number; offset?: number }
  ): Promise<SocialPost[]> {
    let query = this.db
      .selectFrom("social_posts" as never)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null);

    if (filters?.status) {
      query = query.where("status", "=", filters.status);
    }
    if (filters?.type) {
      query = query.where("type", "=", filters.type);
    }
    if (filters?.search) {
      query = query.where((eb) =>
        eb.or([
          eb("title", "like", `%${filters.search}%`),
          eb("content", "like", `%${filters.search}%`)
        ])
      );
    }

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const posts: SocialPost[] = [];
    for (const row of rows) {
      const media = await this.listMedia((row as Record<string, unknown>).id as number);
      const platforms = await this.listPlatforms((row as Record<string, unknown>).id as number);
      posts.push({
        ...(row as unknown as SocialPost),
        media,
        platforms
      });
    }

    return posts;
  }

  async findByUuid(uuid: string, tenantId: string): Promise<SocialPost | null> {
    const row = await this.db
      .selectFrom("social_posts" as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!row) return null;

    const media = await this.listMedia((row as Record<string, unknown>).id as number);
    const platforms = await this.listPlatforms((row as Record<string, unknown>).id as number);

    return {
      ...(row as unknown as SocialPost),
      media,
      platforms
    };
  }

  async create(
    tenantId: string,
    data: {
      title?: string;
      content: string;
      type: PostType;
      status: PostStatus;
      accountIds: number[];
      media?: { url: string; type: string; fileName: string; altText?: string }[];
      scheduledAt?: string;
      createdBy: string;
    }
  ): Promise<SocialPost> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    const postRow = await this.db
      .insertInto("social_posts" as never)
      .values({
        uuid,
        tenant_id: tenantId,
        title: data.title ?? null,
        content: data.content,
        type: data.type,
        status: data.status,
        scheduled_at: data.scheduledAt ?? null,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now
      } as never)
      .executeTakeFirst();

    const postId = Number((postRow as Record<string, unknown>).insertId ?? 0);

    if (data.media && data.media.length > 0) {
      for (let i = 0; i < data.media.length; i++) {
        const m = data.media[i];
        await this.db
          .insertInto("social_post_media" as never)
          .values({
            uuid: crypto.randomUUID(),
            post_id: postId,
            url: m.url,
            type: m.type,
            file_name: m.fileName,
            file_size: 0,
            alt_text: m.altText ?? null,
            sort_order: i,
            created_at: now
          } as never)
          .execute();
      }
    }

    for (const accountId of data.accountIds) {
      const account = await this.db
        .selectFrom("social_accounts" as never)
        .where("id", "=", accountId)
        .executeTakeFirst();

      if (account) {
        await this.db
          .insertInto("social_post_platforms" as never)
          .values({
            post_id: postId,
            account_id: accountId,
            platform: (account as Record<string, unknown>).platform as string,
            status: data.status,
            created_at: now
          } as never)
          .execute();
      }
    }

    const post = await this.findByUuid(uuid, tenantId);
    return post!;
  }

  async update(
    uuid: string,
    tenantId: string,
    data: {
      title?: string;
      content?: string;
      type?: PostType;
      status?: PostStatus;
      scheduledAt?: string;
      publishedAt?: string;
      failureReason?: string;
      retryCount?: number;
    }
  ): Promise<SocialPost | null> {
    const existing = await this.findByUuid(uuid, tenantId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };

    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.type !== undefined) updates.type = data.type;
    if (data.status !== undefined) updates.status = data.status;
    if (data.scheduledAt !== undefined) updates.scheduled_at = data.scheduledAt;
    if (data.publishedAt !== undefined) updates.published_at = data.publishedAt;
    if (data.failureReason !== undefined) updates.failure_reason = data.failureReason;
    if (data.retryCount !== undefined) updates.retry_count = data.retryCount;

    await this.db
      .updateTable("social_posts" as never)
      .set(updates as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    if (data.status !== undefined) {
      await this.db
        .updateTable("social_post_platforms" as never)
        .set({ status: data.status, updated_at: now } as never)
        .where("post_id", "=", existing.id)
        .execute();
    }

    return this.findByUuid(uuid, tenantId);
  }

  async updatePlatformStatus(
    postId: number,
    accountId: number,
    data: { status: PostStatus; platformPostId?: string; failureReason?: string; platformResponse?: Record<string, unknown> }
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .updateTable("social_post_platforms" as never)
      .set({
        status: data.status,
        platform_post_id: data.platformPostId ?? null,
        failure_reason: data.failureReason ?? null,
        platform_response: data.platformResponse ? JSON.stringify(data.platformResponse) : null,
        published_at: data.status === "published" ? now : null,
        updated_at: now
      } as never)
      .where("post_id", "=", postId)
      .where("account_id", "=", accountId)
      .execute();
  }

  async softDelete(uuid: string, tenantId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable("social_posts" as never)
      .set({ deleted_at: now, updated_at: now } as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    return result.numUpdatedRows > 0n;
  }

  async summary(tenantId: string): Promise<Record<PostStatus, number>> {
    const rows = await this.db
      .selectFrom("social_posts" as never)
      .select(["status"])
      .select((eb) => eb.fn.count("id").as("count"))
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .groupBy("status")
      .execute();

    const summary: Record<string, number> = {};
    for (const row of rows) {
      summary[(row as Record<string, unknown>).status as string] = Number(
        (row as Record<string, unknown>).count
      );
    }
    return summary as Record<PostStatus, number>;
  }

  private async listMedia(postId: number): Promise<PostMedia[]> {
    const rows = await this.db
      .selectFrom("social_post_media" as never)
      .where("post_id", "=", postId)
      .orderBy("sort_order", "asc")
      .execute();

    return rows.map((row) => ({
      id: Number((row as Record<string, unknown>).id),
      uuid: (row as Record<string, unknown>).uuid as string,
      postId: Number((row as Record<string, unknown>).post_id),
      url: (row as Record<string, unknown>).url as string,
      type: (row as Record<string, unknown>).type as PostMedia["type"],
      fileName: (row as Record<string, unknown>).file_name as string,
      fileSize: Number((row as Record<string, unknown>).file_size),
      width: (row as Record<string, unknown>).width as number | null,
      height: (row as Record<string, unknown>).height as number | null,
      duration: (row as Record<string, unknown>).duration as number | null,
      altText: (row as Record<string, unknown>).alt_text as string | null,
      sortOrder: Number((row as Record<string, unknown>).sort_order),
      createdAt: (row as Record<string, unknown>).created_at as string
    }));
  }

  private async listPlatforms(postId: number): Promise<PostPlatformTarget[]> {
    const rows = await this.db
      .selectFrom("social_post_platforms" as never)
      .where("post_id", "=", postId)
      .execute();

    return rows.map((row) => ({
      id: Number((row as Record<string, unknown>).id),
      postId: Number((row as Record<string, unknown>).post_id),
      accountId: Number((row as Record<string, unknown>).account_id),
      platform: (row as Record<string, unknown>).platform as PostPlatformTarget["platform"],
      platformPostId: (row as Record<string, unknown>).platform_post_id as string | null,
      status: (row as Record<string, unknown>).status as PostStatus,
      publishedAt: (row as Record<string, unknown>).published_at as string | null,
      failureReason: (row as Record<string, unknown>).failure_reason as string | null,
      platformResponse: (row as Record<string, unknown>).platform_response as Record<string, unknown> | null
    }));
  }
}
