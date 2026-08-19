import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./services.js";
import type {
  SocialPlatform,
  PostStatus,
  PostType,
  ScheduleStatus,
  AnalyticsPeriod
} from "./types.js";

export const socialQueryKeys = {
  accounts: ["social", "accounts"] as const,
  account: (uuid: string) => ["social", "accounts", uuid] as const,
  posts: (filters?: { status?: PostStatus; search?: string }) =>
    ["social", "posts", filters] as const,
  post: (uuid: string) => ["social", "posts", uuid] as const,
  postSummary: ["social", "posts", "summary"] as const,
  schedules: (filters?: { status?: ScheduleStatus; from?: string; to?: string }) =>
    ["social", "schedules", filters] as const,
  scheduleCounts: ["social", "schedules", "counts"] as const,
  upcomingSchedules: (limit?: number) => ["social", "schedules", "upcoming", limit] as const,
  analytics: (filters?: { platform?: SocialPlatform; period?: AnalyticsPeriod }) =>
    ["social", "analytics", filters] as const,
  analyticsSummary: (period: AnalyticsPeriod, from: string, to: string) =>
    ["social", "analytics", "summary", period, from, to] as const,
  templates: (filters?: { type?: PostType; platform?: SocialPlatform; search?: string }) =>
    ["social", "templates", filters] as const,
  template: (uuid: string) => ["social", "templates", uuid] as const,
  dashboard: ["social", "dashboard"] as const
};

export function useSocialAccounts(platform?: SocialPlatform) {
  return useQuery({
    queryFn: () => api.listAccounts(platform),
    queryKey: socialQueryKeys.accounts
  });
}

export function useSocialAccount(uuid: string) {
  return useQuery({
    queryFn: () => api.getAccount(uuid),
    queryKey: socialQueryKeys.account(uuid),
    enabled: !!uuid
  });
}

export function useAccountMutations() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: socialQueryKeys.accounts });
  return {
    create: useMutation({ mutationFn: api.createAccount, onSuccess: done }),
    disconnect: useMutation({ mutationFn: api.disconnectAccount, onSuccess: done }),
    delete: useMutation({ mutationFn: api.deleteAccount, onSuccess: done })
  };
}

export function useSocialPosts(filters?: { status?: PostStatus; search?: string }) {
  return useQuery({
    queryFn: () => api.listPosts(filters),
    queryKey: socialQueryKeys.posts(filters)
  });
}

export function useSocialPost(uuid: string) {
  return useQuery({
    queryFn: () => api.getPost(uuid),
    queryKey: socialQueryKeys.post(uuid),
    enabled: !!uuid
  });
}

export function usePostSummary() {
  return useQuery({
    queryFn: api.getPostSummary,
    queryKey: socialQueryKeys.postSummary
  });
}

export function usePostMutations() {
  const client = useQueryClient();
  const done = () => {
    client.invalidateQueries({ queryKey: ["social", "posts"] });
    client.invalidateQueries({ queryKey: socialQueryKeys.postSummary });
  };
  return {
    create: useMutation({ mutationFn: api.createPost, onSuccess: done }),
    update: useMutation({
      mutationFn: ({ uuid, payload }: { uuid: string; payload: Parameters<typeof api.updatePost>[1] }) =>
        api.updatePost(uuid, payload),
      onSuccess: done
    }),
    publish: useMutation({ mutationFn: api.publishPost, onSuccess: done }),
    cancel: useMutation({ mutationFn: api.cancelPost, onSuccess: done }),
    delete: useMutation({ mutationFn: api.deletePost, onSuccess: done })
  };
}

export function useSocialSchedules(filters?: {
  status?: ScheduleStatus;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryFn: () => api.listSchedules(filters),
    queryKey: socialQueryKeys.schedules(filters)
  });
}

export function useScheduleCounts() {
  return useQuery({
    queryFn: api.getScheduleCounts,
    queryKey: socialQueryKeys.scheduleCounts
  });
}

export function useUpcomingSchedules(limit?: number) {
  return useQuery({
    queryFn: () => api.getUpcomingSchedules(limit),
    queryKey: socialQueryKeys.upcomingSchedules(limit)
  });
}

export function useScheduleMutations() {
  const client = useQueryClient();
  const done = () => {
    client.invalidateQueries({ queryKey: ["social", "schedules"] });
    client.invalidateQueries({ queryKey: socialQueryKeys.scheduleCounts });
  };
  return {
    create: useMutation({ mutationFn: api.createSchedule, onSuccess: done }),
    cancel: useMutation({ mutationFn: api.cancelSchedule, onSuccess: done })
  };
}

export function useSocialAnalytics(filters?: {
  platform?: SocialPlatform;
  period?: AnalyticsPeriod;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryFn: () => api.listAnalytics(filters),
    queryKey: socialQueryKeys.analytics(filters)
  });
}

export function useAnalyticsSummary(period: AnalyticsPeriod, from: string, to: string) {
  return useQuery({
    queryFn: () => api.getAnalyticsSummary(period, from, to),
    queryKey: socialQueryKeys.analyticsSummary(period, from, to),
    enabled: !!from && !!to
  });
}

export function useSocialTemplates(filters?: { type?: PostType; platform?: SocialPlatform; search?: string }) {
  return useQuery({
    queryFn: () => api.listTemplates(filters),
    queryKey: socialQueryKeys.templates(filters)
  });
}

export function useSocialTemplate(uuid: string) {
  return useQuery({
    queryFn: () => api.getTemplate(uuid),
    queryKey: socialQueryKeys.template(uuid),
    enabled: !!uuid
  });
}

export function useTemplateMutations() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: ["social", "templates"] });
  return {
    create: useMutation({ mutationFn: api.createTemplate, onSuccess: done }),
    update: useMutation({
      mutationFn: ({ uuid, payload }: { uuid: string; payload: Parameters<typeof api.updateTemplate>[1] }) =>
        api.updateTemplate(uuid, payload),
      onSuccess: done
    }),
    delete: useMutation({ mutationFn: api.deleteTemplate, onSuccess: done })
  };
}

export function useSocialDashboard() {
  return useQuery({
    queryFn: api.getDashboard,
    queryKey: socialQueryKeys.dashboard
  });
}
