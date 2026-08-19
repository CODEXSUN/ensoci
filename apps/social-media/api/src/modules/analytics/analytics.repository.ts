import type { Kysely } from "kysely";
import type { SocialAnalytics, AnalyticsPeriod, SocialPlatform, SocialAnalyticsSummary } from "../_shared/types.js";

export class SocialAnalyticsRepository {
  constructor(private readonly db: Kysely<unknown>) {}

  async list(
    filters: { accountId?: number; platform?: SocialPlatform; period?: AnalyticsPeriod; from?: string; to?: string; limit?: number; offset?: number }
  ): Promise<SocialAnalytics[]> {
    let query = this.db.selectFrom("social_analytics" as never);

    if (filters.accountId) {
      query = query.where("account_id", "=", filters.accountId);
    }
    if (filters.platform) {
      query = query.where("platform", "=", filters.platform);
    }
    if (filters.period) {
      query = query.where("period", "=", filters.period);
    }
    if (filters.from) {
      query = query.where("date", ">=", filters.from);
    }
    if (filters.to) {
      query = query.where("date", "<=", filters.to);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const rows = await query
      .orderBy("date", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows as unknown as SocialAnalytics[];
  }

  async summary(
    tenantId: string,
    period: AnalyticsPeriod,
    from: string,
    to: string
  ): Promise<SocialAnalyticsSummary[]> {
    const accounts = await this.db
      .selectFrom("social_accounts" as never)
      .where("tenant_id", "=", tenantId)
      .where("deleted_at", "is", null)
      .execute();

    const summaries: SocialAnalyticsSummary[] = [];

    for (const account of accounts) {
      const accountId = Number((account as Record<string, unknown>).id);
      const platform = (account as Record<string, unknown>).platform as SocialPlatform;

      const rows = await this.db
        .selectFrom("social_analytics" as never)
        .where("account_id", "=", accountId)
        .where("period", "=", period)
        .where("date", ">=", from)
        .where("date", "<=", to)
        .select((eb) => [
          eb.fn.sum("impressions").as("totalImpressions"),
          eb.fn.sum("reach").as("totalReach"),
          eb.fn.sum("engagement").as("totalEngagement"),
          eb.fn.sum("likes").as("totalLikes"),
          eb.fn.sum("comments").as("totalComments"),
          eb.fn.sum("shares").as("totalShares"),
          eb.fn.max("followers").as("totalFollowers"),
          eb.fn.sum("followers_growth").as("followersGrowth")
        ])
        .executeTakeFirst();

      if (rows) {
        const totalImpressions = Number((rows as Record<string, unknown>).totalImpressions ?? 0);
        const totalEngagement = Number((rows as Record<string, unknown>).totalEngagement ?? 0);
        const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

        summaries.push({
          platform,
          totalImpressions,
          totalReach: Number((rows as Record<string, unknown>).totalReach ?? 0),
          totalEngagement,
          totalLikes: Number((rows as Record<string, unknown>).totalLikes ?? 0),
          totalComments: Number((rows as Record<string, unknown>).totalComments ?? 0),
          totalShares: Number((rows as Record<string, unknown>).totalShares ?? 0),
          totalFollowers: Number((rows as Record<string, unknown>).totalFollowers ?? 0),
          followersGrowth: Number((rows as Record<string, unknown>).followersGrowth ?? 0),
          topPost: null,
          engagementRate: Math.round(engagementRate * 100) / 100,
          period
        });
      }
    }

    return summaries;
  }

  async topPosts(
    tenantId: string,
    platform: SocialPlatform,
    from: string,
    to: string,
    limit: number
  ): Promise<{ postId: number; totalEngagement: number; totalImpressions: number }[]> {
    const rows = await this.db
      .selectFrom("social_analytics" as never)
      .where("platform", "=", platform)
      .where("date", ">=", from)
      .where("date", "<=", to)
      .where("post_id", "is not", null)
      .select(["post_id"])
      .select((eb) => [
        eb.fn.sum("engagement").as("totalEngagement"),
        eb.fn.sum("impressions").as("totalImpressions")
      ])
      .groupBy("post_id")
      .orderBy("totalEngagement", "desc")
      .limit(limit)
      .execute();

    return rows.map((row) => ({
      postId: Number((row as Record<string, unknown>).post_id),
      totalEngagement: Number((row as Record<string, unknown>).totalEngagement),
      totalImpressions: Number((row as Record<string, unknown>).totalImpressions)
    }));
  }

  async bestPostingTimes(
    tenantId: string,
    platform: SocialPlatform,
    from: string,
    to: string
  ): Promise<{ hour: number; avgEngagement: number }[]> {
    const accounts = await this.db
      .selectFrom("social_accounts" as never)
      .where("tenant_id", "=", tenantId)
      .where("platform", "=", platform)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (accounts.length === 0) return [];

    const accountIds = accounts.map((a) => Number((a as Record<string, unknown>).id));

    const rows = await this.db
      .selectFrom("social_analytics" as never)
      .where("account_id", "in", accountIds)
      .where("date", ">=", from)
      .where("date", "<=", to)
      .where("post_id", "is not", null)
      .select((eb) => [
        eb.fn.avg("engagement").as("avgEngagement"),
        eb.fn.count("id").as("count")
      ])
      .execute();

    return rows
      .map((row) => ({
        hour: 0,
        avgEngagement: Number((row as Record<string, unknown>).avgEngagement ?? 0)
      }))
      .filter((r) => r.avgEngagement > 0)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 24);
  }
}
