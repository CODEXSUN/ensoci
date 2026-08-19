import type { SocialTemplateRepository } from "./template.repository.js";
import type {
  SocialTemplate,
  SocialTemplateCreatePayload,
  SocialTemplateUpdatePayload,
  SocialPlatform,
  PostType,
  SocialMediaRuntimeContext
} from "../_shared/types.js";

export class SocialTemplateService {
  constructor(private readonly repository: SocialTemplateRepository) {}

  async list(
    ctx: SocialMediaRuntimeContext,
    filters?: { type?: PostType; platform?: SocialPlatform; search?: string; limit?: number; offset?: number }
  ): Promise<SocialTemplate[]> {
    return this.repository.list(ctx.tenantId, filters);
  }

  async get(ctx: SocialMediaRuntimeContext, uuid: string): Promise<SocialTemplate | null> {
    return this.repository.findByUuid(uuid, ctx.tenantId);
  }

  async create(
    ctx: SocialMediaRuntimeContext,
    payload: SocialTemplateCreatePayload
  ): Promise<SocialTemplate> {
    return this.repository.create(ctx.tenantId, {
      name: payload.name,
      description: payload.description,
      content: payload.content,
      type: payload.type,
      platforms: payload.platforms,
      media: payload.media,
      tags: payload.tags,
      isPublic: payload.isPublic,
      createdBy: ctx.actorEmail
    });
  }

  async update(
    ctx: SocialMediaRuntimeContext,
    uuid: string,
    payload: SocialTemplateUpdatePayload
  ): Promise<SocialTemplate | null> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return null;

    return this.repository.update(uuid, ctx.tenantId, payload);
  }

  async remove(ctx: SocialMediaRuntimeContext, uuid: string): Promise<boolean> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return false;

    return this.repository.softDelete(uuid, ctx.tenantId);
  }

  async count(ctx: SocialMediaRuntimeContext): Promise<number> {
    return this.repository.count(ctx.tenantId);
  }
}
