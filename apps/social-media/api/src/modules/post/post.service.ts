import type { SocialPostRepository } from "./post.repository.js";
import type {
  SocialPost,
  SocialPostCreatePayload,
  SocialPostUpdatePayload,
  PostStatus,
  SocialMediaRuntimeContext,
  SocialMediaModuleDependencies
} from "../_shared/types.js";

export class SocialPostService {
  constructor(
    private readonly repository: SocialPostRepository,
    private readonly dependencies: SocialMediaModuleDependencies
  ) {}

  async list(
    ctx: SocialMediaRuntimeContext,
    filters?: { status?: PostStatus; search?: string; limit?: number; offset?: number }
  ): Promise<SocialPost[]> {
    return this.repository.list(ctx.tenantId, filters);
  }

  async get(ctx: SocialMediaRuntimeContext, uuid: string): Promise<SocialPost | null> {
    return this.repository.findByUuid(uuid, ctx.tenantId);
  }

  async create(
    ctx: SocialMediaRuntimeContext,
    payload: SocialPostCreatePayload
  ): Promise<SocialPost> {
    const status: PostStatus = payload.scheduledAt ? "scheduled" : "draft";

    const post = await this.repository.create(ctx.tenantId, {
      title: payload.title,
      content: payload.content,
      type: payload.type,
      status,
      accountIds: payload.accountIds,
      media: payload.media,
      scheduledAt: payload.scheduledAt,
      createdBy: ctx.actorEmail
    });

    if (payload.scheduledAt && payload.timezone) {
      await this.dependencies.enqueue({
        type: "social.post.publish",
        postId: post.uuid,
        accountIds: payload.accountIds.map(String)
      });
    }

    return post;
  }

  async update(
    ctx: SocialMediaRuntimeContext,
    uuid: string,
    payload: SocialPostUpdatePayload
  ): Promise<SocialPost | null> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return null;

    return this.repository.update(uuid, ctx.tenantId, {
      title: payload.title,
      content: payload.content,
      type: payload.type,
      status: payload.status,
      scheduledAt: payload.scheduledAt
    });
  }

  async publish(
    ctx: SocialMediaRuntimeContext,
    uuid: string
  ): Promise<SocialPost | null> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return null;

    await this.repository.update(uuid, ctx.tenantId, { status: "publishing" });

    const accountIds = existing.platforms.map((p) => String(p.accountId));
    await this.dependencies.enqueue({
      type: "social.post.publish",
      postId: uuid,
      accountIds
    });

    return this.repository.findByUuid(uuid, ctx.tenantId);
  }

  async cancel(ctx: SocialMediaRuntimeContext, uuid: string): Promise<SocialPost | null> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return null;

    if (existing.status !== "draft" && existing.status !== "scheduled") {
      return existing;
    }

    return this.repository.update(uuid, ctx.tenantId, { status: "cancelled" });
  }

  async remove(ctx: SocialMediaRuntimeContext, uuid: string): Promise<boolean> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return false;

    return this.repository.softDelete(uuid, ctx.tenantId);
  }

  async summary(ctx: SocialMediaRuntimeContext): Promise<Record<PostStatus, number>> {
    return this.repository.summary(ctx.tenantId);
  }
}
