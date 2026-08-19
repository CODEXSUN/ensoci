import type {
  SocialAccount,
  SocialPost,
  SocialSchedule,
  SocialAnalytics,
  SocialTemplate,
  SocialDashboardData,
  SocialAnalyticsSummary,
  SocialPlatform,
  PostStatus,
  PostType,
  ScheduleStatus,
  AnalyticsPeriod
} from "./types.js";

const BASE_URL = "/api/social";

async function socialRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>)
  };

  const tenantId = localStorage.getItem("x-tenant-id");
  const tenantDb = localStorage.getItem("x-tenant-db");
  const companyId = localStorage.getItem("x-company-id");

  if (tenantId) headers["x-tenant-id"] = tenantId;
  if (tenantDb) headers["x-tenant-db"] = tenantDb;
  if (companyId) headers["x-company-id"] = companyId;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed: ${response.status}`);
  }

  return data.data ?? data;
}

export async function listAccounts(platform?: SocialPlatform): Promise<SocialAccount[]> {
  const params = platform ? `?platform=${platform}` : "";
  return socialRequest<SocialAccount[]>(`/accounts${params}`);
}

export async function getAccount(uuid: string): Promise<SocialAccount> {
  return socialRequest<SocialAccount>(`/accounts/${uuid}`);
}

export async function createAccount(payload: {
  platform: SocialPlatform;
  platformUserId: string;
  displayName: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  avatarUrl?: string;
}): Promise<SocialAccount> {
  return socialRequest<SocialAccount>("/accounts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function disconnectAccount(uuid: string): Promise<void> {
  await socialRequest(`/accounts/${uuid}/disconnect`, { method: "POST" });
}

export async function deleteAccount(uuid: string): Promise<void> {
  await socialRequest(`/accounts/${uuid}`, { method: "DELETE" });
}

export async function listPosts(filters?: {
  status?: PostStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<SocialPost[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  const qs = params.toString();
  return socialRequest<SocialPost[]>(`/posts${qs ? `?${qs}` : ""}`);
}

export async function getPost(uuid: string): Promise<SocialPost> {
  return socialRequest<SocialPost>(`/posts/${uuid}`);
}

export async function createPost(payload: {
  title?: string;
  content: string;
  type: PostType;
  accountIds: number[];
  media?: { url: string; type: string; fileName: string; altText?: string }[];
  scheduledAt?: string;
  timezone?: string;
}): Promise<SocialPost> {
  return socialRequest<SocialPost>("/posts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updatePost(
  uuid: string,
  payload: {
    title?: string;
    content?: string;
    type?: PostType;
    status?: PostStatus;
    scheduledAt?: string;
    timezone?: string;
  }
): Promise<SocialPost> {
  return socialRequest<SocialPost>(`/posts/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function publishPost(uuid: string): Promise<SocialPost> {
  return socialRequest<SocialPost>(`/posts/${uuid}/publish`, { method: "POST" });
}

export async function cancelPost(uuid: string): Promise<SocialPost> {
  return socialRequest<SocialPost>(`/posts/${uuid}/cancel`, { method: "POST" });
}

export async function deletePost(uuid: string): Promise<void> {
  await socialRequest(`/posts/${uuid}`, { method: "DELETE" });
}

export async function getPostSummary(): Promise<Record<PostStatus, number>> {
  return socialRequest<Record<PostStatus, number>>("/posts/summary");
}

export async function listSchedules(filters?: {
  status?: ScheduleStatus;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<SocialSchedule[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return socialRequest<SocialSchedule[]>(`/schedules${qs ? `?${qs}` : ""}`);
}

export async function getUpcomingSchedules(limit?: number): Promise<SocialSchedule[]> {
  const params = limit ? `?limit=${limit}` : "";
  return socialRequest<SocialSchedule[]>(`/schedules/upcoming${params}`);
}

export async function createSchedule(payload: {
  postId: number;
  scheduledAt: string;
  timezone: string;
}): Promise<SocialSchedule> {
  return socialRequest<SocialSchedule>("/schedules", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function cancelSchedule(uuid: string): Promise<void> {
  await socialRequest(`/schedules/${uuid}/cancel`, { method: "POST" });
}

export async function getScheduleCounts(): Promise<Record<ScheduleStatus, number>> {
  return socialRequest<Record<ScheduleStatus, number>>("/schedules/counts");
}

export async function listAnalytics(filters?: {
  accountId?: number;
  platform?: SocialPlatform;
  period?: AnalyticsPeriod;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<SocialAnalytics[]> {
  const params = new URLSearchParams();
  if (filters?.accountId) params.set("accountId", String(filters.accountId));
  if (filters?.platform) params.set("platform", filters.platform);
  if (filters?.period) params.set("period", filters.period);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return socialRequest<SocialAnalytics[]>(`/analytics${qs ? `?${qs}` : ""}`);
}

export async function getAnalyticsSummary(
  period: AnalyticsPeriod,
  from: string,
  to: string
): Promise<SocialAnalyticsSummary[]> {
  return socialRequest<SocialAnalyticsSummary[]>(
    `/analytics/summary?period=${period}&from=${from}&to=${to}`
  );
}

export async function getTopPosts(
  platform: SocialPlatform,
  from: string,
  to: string,
  limit?: number
): Promise<{ postId: number; totalEngagement: number; totalImpressions: number }[]> {
  const params = `platform=${platform}&from=${from}&to=${to}${limit ? `&limit=${limit}` : ""}`;
  return socialRequest(`/analytics/top-posts?${params}`);
}

export async function getBestPostingTimes(
  platform: SocialPlatform,
  from: string,
  to: string
): Promise<{ hour: number; avgEngagement: number }[]> {
  return socialRequest(`/analytics/best-times?platform=${platform}&from=${from}&to=${to}`);
}

export async function listTemplates(filters?: {
  type?: PostType;
  platform?: SocialPlatform;
  search?: string;
}): Promise<SocialTemplate[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.platform) params.set("platform", filters.platform);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return socialRequest<SocialTemplate[]>(`/templates${qs ? `?${qs}` : ""}`);
}

export async function getTemplate(uuid: string): Promise<SocialTemplate> {
  return socialRequest<SocialTemplate>(`/templates/${uuid}`);
}

export async function createTemplate(payload: {
  name: string;
  description?: string;
  content: string;
  type: PostType;
  platforms: SocialPlatform[];
  tags?: string[];
  isPublic?: boolean;
}): Promise<SocialTemplate> {
  return socialRequest<SocialTemplate>("/templates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateTemplate(
  uuid: string,
  payload: {
    name?: string;
    description?: string;
    content?: string;
    type?: PostType;
    platforms?: SocialPlatform[];
    tags?: string[];
    isPublic?: boolean;
  }
): Promise<SocialTemplate> {
  return socialRequest<SocialTemplate>(`/templates/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteTemplate(uuid: string): Promise<void> {
  await socialRequest(`/templates/${uuid}`, { method: "DELETE" });
}

export async function getDashboard(): Promise<SocialDashboardData> {
  return socialRequest<SocialDashboardData>("/dashboard");
}
