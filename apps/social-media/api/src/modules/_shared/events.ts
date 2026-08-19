export const socialAccountEvents = {
  created: "social.account.created",
  updated: "social.account.updated",
  disconnected: "social.account.disconnected",
  tokenRefreshed: "social.account.token.refreshed"
} as const;

export const socialPostEvents = {
  created: "social.post.created",
  drafted: "social.post.drafted",
  scheduled: "social.post.scheduled",
  publishing: "social.post.publishing",
  published: "social.post.published",
  failed: "social.post.failed",
  cancelled: "social.post.cancelled"
} as const;

export const socialScheduleEvents = {
  created: "social.schedule.created",
  processing: "social.schedule.processing",
  completed: "social.schedule.completed",
  failed: "social.schedule.failed",
  cancelled: "social.schedule.cancelled"
} as const;

export const socialAnalyticsEvents = {
  collected: "social.analytics.collected"
} as const;

export const socialTemplateEvents = {
  created: "social.template.created",
  updated: "social.template.updated",
  deleted: "social.template.deleted"
} as const;

export function createSocialEvent<TPayload>(
  name: string,
  payload: TPayload,
  source: string,
  actorEmail: string,
  tenantId: string
) {
  return {
    id: crypto.randomUUID(),
    name,
    payload,
    source,
    actorEmail,
    tenantId,
    correlationId: crypto.randomUUID(),
    occurredAt: new Date().toISOString()
  };
}
