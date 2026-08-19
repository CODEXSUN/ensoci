import type { Kysely } from "kysely";

export type SocialPlatform = "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok" | "youtube" | "pinterest";

export type AccountStatus = "active" | "expired" | "disconnected" | "error";

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled";

export type PostType = "text" | "image" | "video" | "link" | "carousel" | "story" | "reel";

export type MediaType = "image" | "video" | "gif" | "document";

export type ScheduleStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type AnalyticsPeriod = "day" | "week" | "month" | "quarter" | "year";

export interface SocialMediaRuntimeContext {
  database: Kysely<unknown>;
  tenantId: string;
  tenantDatabase: string;
  companyId: number;
  actorEmail: string;
  authorize(permission: string): void;
}

export interface SocialMediaModuleDependencies {
  enqueue(payload: SocialMediaQueuePayload): Promise<void>;
  resolveContext(request: { headers: Record<string, unknown> }): Promise<SocialMediaRuntimeContext>;
  secretKey: string;
}

export type SocialMediaQueuePayload =
  | { type: "social.post.publish"; postId: string; accountIds: string[] }
  | { type: "social.post.retry"; postId: string; accountIds: string[] }
  | { type: "social.analytics.collect"; accountId: string; dateRange: { from: string; to: string } }
  | { type: "social.account.refresh"; accountId: string }
  | { type: "social.schedule.process"; scheduleId: string };

export interface SocialAccount {
  id: number;
  uuid: string;
  tenantId: string;
  platform: SocialPlatform;
  platformUserId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  status: AccountStatus;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: number;
  uuid: string;
  tenantId: string;
  title: string | null;
  content: string;
  type: PostType;
  status: PostStatus;
  media: PostMedia[];
  platforms: PostPlatformTarget[];
  scheduledAt: string | null;
  publishedAt: string | null;
  failureReason: string | null;
  retryCount: number;
  maxRetries: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostMedia {
  id: number;
  uuid: string;
  postId: number;
  url: string;
  type: MediaType;
  fileName: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface PostPlatformTarget {
  id: number;
  postId: number;
  accountId: number;
  platform: SocialPlatform;
  platformPostId: string | null;
  status: PostStatus;
  publishedAt: string | null;
  failureReason: string | null;
  platformResponse: Record<string, unknown> | null;
}

export interface SocialSchedule {
  id: number;
  uuid: string;
  tenantId: string;
  postId: number;
  scheduledAt: string;
  timezone: string;
  status: ScheduleStatus;
  processedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAnalytics {
  id: number;
  uuid: string;
  accountId: number;
  postId: number | null;
  platform: SocialPlatform;
  period: AnalyticsPeriod;
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
  avgWatchTime: number | null;
  sentiment: number | null;
  rawMetrics: Record<string, unknown>;
  collectedAt: string;
  createdAt: string;
}

export interface SocialTemplate {
  id: number;
  uuid: string;
  tenantId: string;
  name: string;
  description: string | null;
  content: string;
  type: PostType;
  platforms: SocialPlatform[];
  media: TemplateMedia[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateMedia {
  url: string;
  type: MediaType;
  fileName: string;
  altText: string | null;
  sortOrder: number;
}

export interface SocialAccountCreatePayload {
  platform: SocialPlatform;
  platformUserId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes?: string[];
}

export interface SocialAccountUpdatePayload {
  displayName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes?: string[];
  status?: AccountStatus;
}

export interface SocialPostCreatePayload {
  title?: string;
  content: string;
  type: PostType;
  accountIds: number[];
  media?: { url: string; type: MediaType; fileName: string; altText?: string }[];
  scheduledAt?: string;
  timezone?: string;
}

export interface SocialPostUpdatePayload {
  title?: string;
  content?: string;
  type?: PostType;
  accountIds?: number[];
  media?: { url: string; type: MediaType; fileName: string; altText?: string }[];
  scheduledAt?: string;
  timezone?: string;
  status?: PostStatus;
}

export interface SocialScheduleCreatePayload {
  postId: number;
  scheduledAt: string;
  timezone: string;
}

export interface SocialTemplateCreatePayload {
  name: string;
  description?: string;
  content: string;
  type: PostType;
  platforms: SocialPlatform[];
  media?: TemplateMedia[];
  tags?: string[];
  isPublic?: boolean;
}

export interface SocialTemplateUpdatePayload {
  name?: string;
  description?: string;
  content?: string;
  type?: PostType;
  platforms?: SocialPlatform[];
  media?: TemplateMedia[];
  tags?: string[];
  isPublic?: boolean;
}

export interface SocialAnalyticsSummary {
  platform: SocialPlatform;
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalFollowers: number;
  followersGrowth: number;
  topPost: SocialPost | null;
  engagementRate: number;
  period: AnalyticsPeriod;
}

export interface SocialDashboardData {
  accounts: SocialAccount[];
  summary: SocialAnalyticsSummary[];
  upcomingPosts: SocialPost[];
  recentPosts: SocialPost[];
  scheduleQueue: SocialSchedule[];
}

export type SocialMediaEvent =
  | { type: "account.connected"; accountId: string; platform: SocialPlatform }
  | { type: "account.disconnected"; accountId: string; platform: SocialPlatform }
  | { type: "account.token.refreshed"; accountId: string }
  | { type: "post.created"; postId: string; platforms: SocialPlatform[] }
  | { type: "post.published"; postId: string; platform: SocialPlatform; platformPostId: string }
  | { type: "post.failed"; postId: string; platform: SocialPlatform; reason: string }
  | { type: "schedule.processed"; scheduleId: string; postId: string }
  | { type: "analytics.collected"; accountId: string; date: string };
