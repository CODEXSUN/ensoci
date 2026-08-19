import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SocialPostService } from "./post.service.js";
import { SocialPostRepository } from "./post.repository.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

const postTypeSchema = z.enum(["text", "image", "video", "link", "carousel", "story", "reel"]);

const postCreateSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  type: postTypeSchema,
  accountIds: z.array(z.number().int().positive()).min(1),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "gif", "document"]),
        fileName: z.string(),
        altText: z.string().optional()
      })
    )
    .optional(),
  scheduledAt: z.string().datetime().optional(),
  timezone: z.string().optional()
});

const postUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1).optional(),
  type: postTypeSchema.optional(),
  accountIds: z.array(z.number().int().positive()).optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "gif", "document"]),
        fileName: z.string(),
        altText: z.string().optional()
      })
    )
    .optional(),
  scheduledAt: z.string().datetime().optional(),
  timezone: z.string().optional(),
  status: z.enum(["draft", "scheduled", "cancelled"]).optional()
});

export async function registerPostRoutes(
  app: FastifyInstance,
  dependencies: SocialMediaModuleDependencies
) {
  const repository = new SocialPostRepository(undefined!);
  const service = new SocialPostService(repository, dependencies);

  app.get("/social/posts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const posts = await service.list(ctx, {
      status: query.status as "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled" | undefined,
      search: query.search as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined
    });

    return reply.send({ data: posts, success: true });
  });

  app.get("/social/posts/summary", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const summary = await service.summary(ctx);
    return reply.send({ data: summary, success: true });
  });

  app.get("/social/posts/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const post = await service.get(ctx, uuid);

    if (!post) {
      return reply.status(404).send({ error: "Post not found", success: false });
    }

    return reply.send({ data: post, success: true });
  });

  app.post("/social/posts", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const parsed = postCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const post = await service.create(ctx, parsed.data);
    return reply.status(201).send({ data: post, success: true });
  });

  app.put("/social/posts/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const parsed = postUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const post = await service.update(ctx, uuid, parsed.data);
    if (!post) {
      return reply.status(404).send({ error: "Post not found", success: false });
    }

    return reply.send({ data: post, success: true });
  });

  app.post("/social/posts/:uuid/publish", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const post = await service.publish(ctx, uuid);

    if (!post) {
      return reply.status(404).send({ error: "Post not found", success: false });
    }

    return reply.send({ data: post, success: true });
  });

  app.post("/social/posts/:uuid/cancel", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const post = await service.cancel(ctx, uuid);

    if (!post) {
      return reply.status(404).send({ error: "Post not found", success: false });
    }

    return reply.send({ data: post, success: true });
  });

  app.delete("/social/posts/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.posts.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const result = await service.remove(ctx, uuid);

    if (!result) {
      return reply.status(404).send({ error: "Post not found", success: false });
    }

    return reply.send({ success: true });
  });
}
