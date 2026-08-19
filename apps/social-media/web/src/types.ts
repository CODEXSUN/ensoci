export type SocialPlatform = "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok" | "youtube" | "pinterest";

export type AccountStatus = "active" | "expired" | "disconnected" | "error";

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled";

export type PostType = "text" | "image" | "video" | "link" | "carousel" | "story" | "reel";

export type MediaType = "image" | "video" | "gif" | "document";

export type ScheduleStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type AnalyticsPeriod = "day" | "week" | "month" | "quarter" | "year";

export interface SocialAccount {
  id: number;
  uuid: string;
  tenantId: string;
  platform: SocialPlatform;
  platformUserId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
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
