import { createHash } from "node:crypto";
import { aesGcmEncrypt, aesGcmDecrypt } from "./secrets.js";

export type SocialMediaWorkerDependencies = {
  database: import("kysely").Kysely<unknown>;
  secretKey: string;
};

export async function processSocialPost(
  deps: SocialMediaWorkerDependencies,
  postId: string,
  accountIds: string[]
): Promise<{ platform: string; platformPostId: string }[]> {
  const results: { platform: string; platformPostId: string }[] = [];

  for (const accountId of accountIds) {
    const account = await deps.database
      .selectFrom("social_accounts" as never)
      .where("uuid", "=", accountId)
      .where("status", "=", "active")
      .executeTakeFirst();

    if (!account) continue;

    const post = await deps.database
      .selectFrom("social_posts" as never)
      .where("uuid", "=", postId)
      .executeTakeFirst();

    if (!post) continue;

    try {
      const platformPostId = await publishToPlatform(
        (account as Record<string, unknown>).platform as string,
        (account as Record<string, unknown>).access_token as string,
        (post as Record<string, unknown>).content as string
      );

      results.push({
        platform: (account as Record<string, unknown>).platform as string,
        platformPostId
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      await deps.database
        .updateTable("social_post_platforms" as never)
        .set({
          status: "failed",
          failure_reason: reason,
          updated_at: new Date().toISOString()
        } as never)
        .where("account_id", "=", Number(accountId))
        .where("post_id", "=", Number(postId))
        .execute();
    }
  }

  return results;
}

async function publishToPlatform(
  platform: string,
  accessToken: string,
  content: string
): Promise<string> {
  const platformEndpoints: Record<string, string> = {
    facebook: "https://graph.facebook.com/v18.0/me/feed",
    instagram: "https://graph.facebook.com/v18.0/me/media",
    twitter: "https://api.twitter.com/2/tweets",
    linkedin: "https://api.linkedin.com/v2/ugcPosts",
    tiktok: "https://open.tiktokapis.com/v2/post/publish/video/init/"
  };

  const endpoint = platformEndpoints[platform];
  if (!endpoint) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: content, text: content })
  });

  if (!response.ok) {
    throw new Error(`Platform API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return (data.id ?? data.data?.id ?? crypto.randomUUID()) as string;
}

export async function collectAccountAnalytics(
  deps: SocialMediaWorkerDependencies,
  accountId: string,
  dateRange: { from: string; to: string }
): Promise<void> {
  const account = await deps.database
    .selectFrom("social_accounts" as never)
    .where("uuid", "=", accountId)
    .executeTakeFirst();

  if (!account) return;

  const platform = (account as Record<string, unknown>).platform as string;
  const accessToken = (account as Record<string, unknown>).access_token as string;

  const metrics = await fetchPlatformAnalytics(platform, accessToken, dateRange);

  for (const metric of metrics) {
    const uuid = crypto.randomUUID();
    await deps.database
      .insertInto("social_analytics" as never)
      .values({
        uuid,
        account_id: (account as Record<string, unknown>).id,
        platform,
        period: "day",
        date: metric.date,
        impressions: metric.impressions,
        reach: metric.reach,
        engagement: metric.engagement,
        likes: metric.likes,
        comments: metric.comments,
        shares: metric.shares,
        saves: metric.saves,
        clicks: metric.clicks,
        followers: metric.followers,
        followers_growth: metric.followersGrowth,
        profile_views: metric.profileViews,
        website_clicks: metric.websiteClicks,
        video_views: metric.videoViews,
        raw_metrics: metric.raw,
        collected_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      } as never)
      .execute();
  }
}

async function fetchPlatformAnalytics(
  platform: string,
  accessToken: string,
  dateRange: { from: string; to: string }
): Promise<
  {
    date: string;
    impressions: number;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    followers: number;
    followersGrowth: number;
    profileViews: number;
    websiteClicks: number;
    videoViews: number;
    raw: Record<string, unknown>;
  }[]
> {
  const analyticsEndpoints: Record<string, string> = {
    facebook: `https://graph.facebook.com/v18.0/me/insights?metric=page_impressions,page_reach,page_engaged_users&period=day&since=${dateRange.from}&until=${dateRange.to}`,
    instagram: `https://graph.facebook.com/v18.0/me/insights?metric=impressions,reach,engagement&period=day&since=${dateRange.from}&until=${dateRange.to}`,
    twitter: `https://api.twitter.com/2/users/me?user.fields=public_metrics`,
    linkedin: `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organization=me`
  };

  const endpoint = analyticsEndpoints[platform];
  if (!endpoint) return [];

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) return [];

    const data = (await response.json()) as Record<string, unknown>;
    return [
      {
        date: dateRange.from,
        impressions: Number(data.data?.[0]?.value ?? 0),
        reach: Number(data.data?.[1]?.value ?? 0),
        engagement: Number(data.data?.[2]?.value ?? 0),
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
        followers: 0,
        followersGrowth: 0,
        profileViews: 0,
        websiteClicks: 0,
        videoViews: 0,
        raw: data
      }
    ];
  } catch {
    return [];
  }
}

export async function refreshTokenIfNeeded(
  deps: SocialMediaWorkerDependencies,
  accountId: string
): Promise<boolean> {
  const account = await deps.database
    .selectFrom("social_accounts" as never)
    .where("uuid", "=", accountId)
    .executeTakeFirst();

  if (!account) return false;

  const expiresAt = (account as Record<string, unknown>).token_expires_at as string | null;
  const refreshToken = (account as Record<string, unknown>).refresh_token as string | null;

  if (!expiresAt || !refreshToken) return true;

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiryDate.getTime() - now.getTime() > fiveMinutes) {
    return true;
  }

  const platform = (account as Record<string, unknown>).platform as string;
  const newTokens = await refreshPlatformToken(platform, refreshToken, deps.secretKey);

  if (newTokens) {
    await deps.database
      .updateTable("social_accounts" as never)
      .set({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken ?? refreshToken,
        token_expires_at: newTokens.expiresAt,
        updated_at: new Date().toISOString()
      } as never)
      .where("uuid", "=", accountId)
      .execute();
    return true;
  }

  await deps.database
    .updateTable("social_accounts" as never)
    .set({ status: "expired", updated_at: new Date().toISOString() } as never)
    .where("uuid", "=", accountId)
    .execute();

  return false;
}

async function refreshPlatformToken(
  platform: string,
  refreshToken: string,
  secretKey: string
): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: string } | null> {
  const refreshEndpoints: Record<string, { url: string; clientId: string }> = {
    facebook: { url: "https://graph.facebook.com/v18.0/oauth/access_token", clientId: "" },
    instagram: { url: "https://graph.facebook.com/v18.0/oauth/access_token", clientId: "" },
    twitter: { url: "https://api.twitter.com/2/oauth2/token", clientId: "" },
    linkedin: { url: "https://www.linkedin.com/oauth/v2/accessToken", clientId: "" }
  };

  const config = refreshEndpoints[platform];
  if (!config) return null;

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: secretKey
      }).toString()
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const expiresIn = Number(data.expires_in ?? 3600);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) ?? null,
      expiresAt
    };
  } catch {
    return null;
  }
}
