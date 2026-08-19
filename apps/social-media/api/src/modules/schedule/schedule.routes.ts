import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SocialScheduleService } from "./schedule.service.js";
import { SocialScheduleRepository } from "./schedule.repository.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

const scheduleCreateSchema = z.object({
  postId: z.number().int().positive(),
  scheduledAt: z.string().datetime(),
  timezone: z.string().min(1)
});

export async function registerScheduleRoutes(
  app: FastifyInstance,
  dependencies: SocialMediaModuleDependencies
) {
  const repository = new SocialScheduleRepository(undefined!);
  const service = new SocialScheduleService(repository, dependencies);

  app.get("/social/schedules", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const schedules = await service.list(ctx, {
      status: query.status as "pending" | "processing" | "completed" | "failed" | "cancelled" | undefined,
      from: query.from as string | undefined,
      to: query.to as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined
    });

    return reply.send({ data: schedules, success: true });
  });

  app.get("/social/schedules/upcoming", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const limit = query.limit ? Number(query.limit) : 10;
    const schedules = await service.upcoming(ctx, limit);

    return reply.send({ data: schedules, success: true });
  });

  app.get("/social/schedules/counts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const counts = await service.counts(ctx);
    return reply.send({ data: counts, success: true });
  });

  app.get("/social/schedules/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const schedule = await service.get(ctx, uuid);

    if (!schedule) {
      return reply.status(404).send({ error: "Schedule not found", success: false });
    }

    return reply.send({ data: schedule, success: true });
  });

  app.post("/social/schedules", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const parsed = scheduleCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const schedule = await service.create(ctx, parsed.data);
    return reply.status(201).send({ data: schedule, success: true });
  });

  app.post("/social/schedules/:uuid/cancel", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const result = await service.cancel(ctx, uuid);

    if (!result) {
      return reply.status(404).send({ error: "Schedule not found or already processed", success: false });
    }

    return reply.send({ success: true });
  });

  app.post("/social/schedules/process", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.schedules.manage");
    repository["db"] = ctx.database;

    const processed = await service.processPending();
    return reply.send({ data: { processed }, success: true });
  });
}
