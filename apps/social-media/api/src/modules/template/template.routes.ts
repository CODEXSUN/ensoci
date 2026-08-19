import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SocialTemplateService } from "./template.service.js";
import { SocialTemplateRepository } from "./template.repository.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

const postTypeSchema = z.enum(["text", "image", "video", "link", "carousel", "story", "reel"]);
const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest"
]);

const templateCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  type: postTypeSchema,
  platforms: z.array(socialPlatformSchema).min(1),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "gif", "document"]),
        fileName: z.string(),
        altText: z.string().optional(),
        sortOrder: z.number().int().optional()
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  type: postTypeSchema.optional(),
  platforms: z.array(socialPlatformSchema).min(1).optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "gif", "document"]),
        fileName: z.string(),
        altText: z.string().optional(),
        sortOrder: z.number().int().optional()
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

export async function registerTemplateRoutes(
  app: FastifyInstance,
  dependencies: SocialMediaModuleDependencies
) {
  const repository = new SocialTemplateRepository(undefined!);
  const service = new SocialTemplateService(repository);

  app.get("/social/templates", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.templates.manage");
    repository["db"] = ctx.database;

    const query = request.query as Record<string, unknown>;
    const templates = await service.list(ctx, {
      type: query.type as "text" | "image" | "video" | "link" | "carousel" | "story" | "reel" | undefined,
      platform: query.platform as "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok" | "youtube" | "pinterest" | undefined,
      search: query.search as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined
    });

    return reply.send({ data: templates, success: true });
  });

  app.get("/social/templates/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.templates.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const template = await service.get(ctx, uuid);

    if (!template) {
      return reply.status(404).send({ error: "Template not found", success: false });
    }

    return reply.send({ data: template, success: true });
  });

  app.post("/social/templates", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.templates.manage");
    repository["db"] = ctx.database;

    const parsed = templateCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const template = await service.create(ctx, parsed.data);
    return reply.status(201).send({ data: template, success: true });
  });

  app.put("/social/templates/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.templates.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const parsed = templateUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message, success: false });
    }

    const template = await service.update(ctx, uuid, parsed.data);
    if (!template) {
      return reply.status(404).send({ error: "Template not found", success: false });
    }

    return reply.send({ data: template, success: true });
  });

  app.delete("/social/templates/:uuid", async (request, reply) => {
    const ctx = await dependencies.resolveContext(request as never);
    ctx.authorize("social.templates.manage");
    repository["db"] = ctx.database;

    const { uuid } = request.params as { uuid: string };
    const result = await service.remove(ctx, uuid);

    if (!result) {
      return reply.status(404).send({ error: "Template not found", success: false });
    }

    return reply.send({ success: true });
  });
}
