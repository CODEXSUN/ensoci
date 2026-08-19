import type { SocialAnalyticsRepository } from "./analytics.repository.js";
import type {
  SocialAnalytics,
  AnalyticsPeriod,
  SocialPlatform,
  SocialAnalyticsSummary,
  SocialMediaRuntimeContext,
  SocialMediaModuleDependencies
} from "../_shared/types.js";

export class SocialAnalyticsService {
  constructor(
    private readonly repository: SocialAnalyticsRepository,
    private readonly dependencies: SocialMediaModuleDependencies
  ) {}

  async list(
    ctx: SocialMediaRuntimeContext,
    filters?: {
      accountId?: number;
      platform?: SocialPlatform;
      period?: AnalyticsPeriod;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<SocialAnalytics[]> {
    return this.repository.list(filters ?? {});
  }

  async summary(
    ctx: SocialMediaRuntimeContext,
    period: AnalyticsPeriod,
    from: string,
    to: string
  ): Promise<SocialAnalyticsSummary[]> {
    return this.repository.summary(ctx.tenantId, period, from, to);
  }

  async topPosts(
    ctx: SocialMediaRuntimeContext,
    platform: SocialPlatform,
    from: string,
    to: string,
    limit: number
  ): Promise<{ postId: number; totalEngagement: number; totalImpressions: number }[]> {
    return this.repository.topPosts(ctx.tenantId, platform, from, to, limit);
  }

  async bestPostingTimes(
    ctx: SocialMediaRuntimeContext,
    platform: SocialPlatform,
    from: string,
    to: string
  ): Promise<{ hour: number; avgEngagement: number }[]> {
    return this.repository.bestPostingTimes(ctx.tenantId, platform, from, to);
  }

  async collectForAccount(
    ctx: SocialMediaRuntimeContext,
    accountId: string,
    dateRange: { from: string; to: string }
  ): Promise<void> {
    await this.dependencies.enqueue({
      type: "social.analytics.collect",
      accountId,
      dateRange
    });
  }
}
