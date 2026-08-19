import type { Kysely } from "kysely";
import type { SocialTemplate, SocialPlatform, TemplateMedia, PostType } from "../_shared/types.js";

export class SocialTemplateRepository {
  constructor(private readonly db: Kysely<unknown>) {}

  async list(
    tenantId: string,
    filters?: { type?: PostType; platform?: SocialPlatform; search?: string; limit?: number; offset?: number }
  ): Promise<SocialTemplate[]> {
    let query = this.db
      .selectFrom("social_templates" as never)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null);

    if (filters?.type) {
      query = query.where("type", "=", filters.type);
    }
    if (filters?.search) {
      query = query.where((eb) =>
        eb.or([
          eb("name", "like", `%${filters.search}%`),
          eb("content", "like", `%${filters.search}%`),
          eb("description", "like", `%${filters.search}%`)
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

    return rows.map((row) => ({
      id: Number((row as Record<string, unknown>).id),
      uuid: (row as Record<string, unknown>).uuid as string,
      tenantId: (row as Record<string, unknown>).tenant_id as string,
      name: (row as Record<string, unknown>).name as string,
      description: (row as Record<string, unknown>).description as string | null,
      content: (row as Record<string, unknown>).content as string,
      type: (row as Record<string, unknown>).type as PostType,
      platforms: JSON.parse((row as Record<string, unknown>).platforms as string),
      media: JSON.parse(((row as Record<string, unknown>).media as string) ?? "[]"),
      tags: JSON.parse(((row as Record<string, unknown>).tags as string) ?? "[]"),
      isPublic: Boolean((row as Record<string, unknown>).is_public),
      createdBy: (row as Record<string, unknown>).created_by as string,
      createdAt: (row as Record<string, unknown>).created_at as string,
      updatedAt: (row as Record<string, unknown>).updated_at as string
    }));
  }

  async findByUuid(uuid: string, tenantId: string): Promise<SocialTemplate | null> {
    const row = await this.db
      .selectFrom("social_templates" as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: Number((row as Record<string, unknown>).id),
      uuid: (row as Record<string, unknown>).uuid as string,
      tenantId: (row as Record<string, unknown>).tenant_id as string,
      name: (row as Record<string, unknown>).name as string,
      description: (row as Record<string, unknown>).description as string | null,
      content: (row as Record<string, unknown>).content as string,
      type: (row as Record<string, unknown>).type as PostType,
      platforms: JSON.parse((row as Record<string, unknown>).platforms as string),
      media: JSON.parse(((row as Record<string, unknown>).media as string) ?? "[]"),
      tags: JSON.parse(((row as Record<string, unknown>).tags as string) ?? "[]"),
      isPublic: Boolean((row as Record<string, unknown>).is_public),
      createdBy: (row as Record<string, unknown>).created_by as string,
      createdAt: (row as Record<string, unknown>).created_at as string,
      updatedAt: (row as Record<string, unknown>).updated_at as string
    };
  }

  async create(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      content: string;
      type: PostType;
      platforms: SocialPlatform[];
      media?: TemplateMedia[];
      tags?: string[];
      isPublic?: boolean;
      createdBy: string;
    }
  ): Promise<SocialTemplate> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .insertInto("social_templates" as never)
      .values({
        uuid,
        tenant_id: tenantId,
        name: data.name,
        description: data.description ?? null,
        content: data.content,
        type: data.type,
        platforms: JSON.stringify(data.platforms),
        media: JSON.stringify(data.media ?? []),
        tags: JSON.stringify(data.tags ?? []),
        is_public: data.isPublic ?? false,
        created_by: data.createdBy,
        created_at: now,
        updated_at: now
      } as never)
      .execute();

    return this.findByUuid(uuid, tenantId) as Promise<SocialTemplate>;
  }

  async update(
    uuid: string,
    tenantId: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      type?: PostType;
      platforms?: SocialPlatform[];
      media?: TemplateMedia[];
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<SocialTemplate | null> {
    const existing = await this.findByUuid(uuid, tenantId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.content !== undefined) updates.content = data.content;
    if (data.type !== undefined) updates.type = data.type;
    if (data.platforms !== undefined) updates.platforms = JSON.stringify(data.platforms);
    if (data.media !== undefined) updates.media = JSON.stringify(data.media);
    if (data.tags !== undefined) updates.tags = JSON.stringify(data.tags);
    if (data.isPublic !== undefined) updates.is_public = data.isPublic;

    await this.db
      .updateTable("social_templates" as never)
      .set(updates as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    return this.findByUuid(uuid, tenantId);
  }

  async softDelete(uuid: string, tenantId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable("social_templates" as never)
      .set({ deleted_at: now, updated_at: now } as never)
      .where("uuid", "=", uuid)
      .where("tenant_id", "=", tenantId)
      .execute();

    return result.numUpdatedRows > 0n;
  }

  async count(tenantId: string): Promise<number> {
    const row = await this.db
      .selectFrom("social_templates" as never)
      .select((eb) => eb.fn.count("id").as("count"))
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    return Number((row as Record<string, unknown>)?.count ?? 0);
  }
}
