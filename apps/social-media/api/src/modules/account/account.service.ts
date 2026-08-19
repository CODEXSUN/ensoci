import type { SocialAccountRepository } from "./account.repository.js";
import type {
  SocialAccount,
  SocialAccountCreatePayload,
  SocialAccountUpdatePayload,
  SocialPlatform,
  SocialMediaRuntimeContext
} from "../_shared/types.js";

export class SocialAccountService {
  constructor(private readonly repository: SocialAccountRepository) {}

  async context(deps: {
    resolveContext: (req: { headers: Record<string, unknown> }) => Promise<SocialMediaRuntimeContext>;
    request: { headers: Record<string, unknown> };
  }): Promise<SocialMediaRuntimeContext> {
    const ctx = await deps.resolveContext(deps.request);
    ctx.authorize("social.accounts.manage");
    return ctx;
  }

  async list(
    ctx: SocialMediaRuntimeContext,
    platform?: SocialPlatform
  ): Promise<SocialAccount[]> {
    return this.repository.list(ctx.tenantId, platform);
  }

  async get(ctx: SocialMediaRuntimeContext, uuid: string): Promise<SocialAccount | null> {
    return this.repository.findByUuid(uuid, ctx.tenantId);
  }

  async create(
    ctx: SocialMediaRuntimeContext,
    payload: SocialAccountCreatePayload
  ): Promise<SocialAccount> {
    const existing = await this.repository.findByPlatformUser(
      payload.platform,
      payload.platformUserId,
      ctx.tenantId
    );

    if (existing) {
      return this.repository.update(existing.uuid, ctx.tenantId, {
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        tokenExpiresAt: payload.tokenExpiresAt,
        scopes: payload.scopes,
        status: "active"
      }) as Promise<SocialAccount>;
    }

    return this.repository.create(ctx.tenantId, payload, ctx.actorEmail);
  }

  async update(
    ctx: SocialMediaRuntimeContext,
    uuid: string,
    payload: SocialAccountUpdatePayload
  ): Promise<SocialAccount | null> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return null;

    return this.repository.update(uuid, ctx.tenantId, payload);
  }

  async disconnect(ctx: SocialMediaRuntimeContext, uuid: string): Promise<boolean> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return false;

    return this.repository.disconnect(uuid, ctx.tenantId);
  }

  async remove(ctx: SocialMediaRuntimeContext, uuid: string): Promise<boolean> {
    const existing = await this.repository.findByUuid(uuid, ctx.tenantId);
    if (!existing) return false;

    return this.repository.softDelete(uuid, ctx.tenantId);
  }

  async counts(ctx: SocialMediaRuntimeContext): Promise<Record<SocialPlatform, number>> {
    return this.repository.count(ctx.tenantId);
  }
}
