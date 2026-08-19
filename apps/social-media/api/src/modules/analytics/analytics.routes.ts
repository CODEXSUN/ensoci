import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SocialAnalyticsService } from "./analytics.service.js";
import { SocialAnalyticsRepository } from "./analytics.repository.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

const analyticsPeriodSchema = z.enum(["day", "week", "month", "quarter", "year"]);
const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest"
]);

export async function registerAnalyticsRoutes(
  app: FastifyInstance,
  dependencies: SocialMediaModuleDependencies
) {
  const repository = new SocialAnalyticsRepository(undefined!);
  const service = new SocialAnalyticsService(repository, dependencies);

  app.get("/social/analytics", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.analytics.view");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const analytics = await service.list(ctx, {
      accountId: query.accountId ? Number(query.accountId) : undefined,
      platform: query.platform as SocialPlatform | undefined,
      period: query.period as AnalyticsPeriod | undefined,
      from: query.from as string | undefined,
      to: query.to as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined
    });

    return reply.send({ data: analytics, success: true });
  });

  app.get("/social/analytics/summary", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.analytics.view");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const period = (query.period as AnalyticsPeriod) ?? "month";
    const from = query.from as string;
    const to = query.to as string;

    if (!from || !to) {
      return reply.status(400).send({ error: "from and to dates are required", success: false });
    }

    const summary = await service.summary(ctx, period, from, to);
    return reply.send({ data: summary, success: true });
  });

  app.get("/social/analytics/top-posts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.analytics.view");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const platform = query.platform as SocialPlatform;
    const from = query.from as string;
    const to = query.to as string;
    const limit = query.limit ? Number(query.limit) : 10;

    if (!platform || !from || !to) {
      return reply.status(400).send({ error: "platform, from, and to are required", success: false });
    }

    const topPosts = await service.topPosts(ctx, platform, from, to, limit);
    return reply.send({ data: topPosts, success: true });
  });

  app.get("/social/analytics/best-times", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.analytics.view");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const platform = query.platform as SocialPlatform;
    const from = query.from as string;
    const to = query.to as string;

    if (!platform || !from || !to) {
      return reply.status(400).send({ error: "platform, from, and to are required", success: false });
    }

    const bestTimes = await service.bestPostingTimes(ctx, platform, from, to);
    return reply.send({ data: bestTimes, success: true });
  });

  app.post("/social/analytics/collect/:accountId", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.analytics.view");
    repository["db"] = ctx.database;

    const { accountId } = request.params as { accountId: string };
    const query = request.query as Record<string, unknown>;

    await service.collectForAccount(ctx, accountId, {
      from: (query.from as string) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      to: (query.to as string) ?? new Date().toISOString().split("T")[0]
    });

    return reply.send({ success: true });
  });
}
