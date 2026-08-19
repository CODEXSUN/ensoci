import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SocialAccountService } from "./account.service.js";
import { SocialAccountRepository } from "./account.repository.js";
import type { SocialMediaModuleDependencies, SocialMediaRuntimeContext } from "../_shared/types.js";

const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest"
]);

const accountCreateSchema = z.object({
  platform: socialPlatformSchema,
  platformUserId: z.string().min(1),
  displayName: z.string().min(1),
  username: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
  scopes: z.array(z.string()).optional()
});

const accountUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  status: z.enum(["active", "expired", "disconnected", "error"]).optional()
});

export async function registerAccountRoutes(
  app: FastifyInstance,
  dependencies: SocialMediaModuleDependencies
) {
  const repository = new SocialAccountRepository(undefined!);
  const service = new SocialAccountService(repository);

  app.get("/social/accounts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const platform = (request.query as Record<string, unknown>)?.platform as
      | "facebook"
      | "instagram"
      | "twitter"
      | "linkedin"
      | "tiktok"
      | "youtube"
      | "pinterest"
      | undefined;

    const accounts = await service.list(ctx, platform);
    return reply.send({ data: accounts, success: true });
  });

  app.get("/social/accounts/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const account = await service.get(ctx, uuid);

    if (!account) {
      return reply.status(404).send({ error: "Account not found", success: false });
    }

    return reply.send({ data: account, success: true });
  });

  app.post("/social/accounts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const parsed = accountCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const account = await service.create(ctx, parsed.data);
    return reply.status(201).send({ data: account, success: true });
  });

  app.put("/social/accounts/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const parsed = accountUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const account = await service.update(ctx, uuid, parsed.data);
    if (!account) {
      return reply.status(404).send({ error: "Account not found", success: false });
    }

    return reply.send({ data: account, success: true });
  });

  app.post("/social/accounts/:uuid/disconnect", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const result = await service.disconnect(ctx, uuid);

    if (!result) {
      return reply.status(404).send({ error: "Account not found", success: false });
    }

    return reply.send({ success: true });
  });

  app.delete("/social/accounts/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const result = await service.remove(ctx, uuid);

    if (!result) {
      return reply.status(404).send({ error: "Account not found", success: false });
    }

    return reply.send({ success: true });
  });

  app.get("/social/accounts/counts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.accounts.manage");
    repository["db"] = ctx.database;

    const counts = await service.counts(ctx);
    return reply.send({ data: counts, success: true });
  });
}
