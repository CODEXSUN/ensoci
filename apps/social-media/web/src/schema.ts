import { z } from "zod";

export const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest"
]);

export const postTypeSchema = z.enum(["text", "image", "video", "link", "carousel", "story", "reel"]);

export const accountCreateSchema = z.object({
  platform: socialPlatformSchema,
  platformUserId: z.string().min(1, "Platform User ID is required"),
  displayName: z.string().min(1, "Display Name is required"),
  username: z.string().min(1, "Username is required"),
  accessToken: z.string().min(1, "Access Token is required")
});

export const postCreateSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  type: postTypeSchema,
  accountIds: z.array(z.number()).min(1, "Select at least one account"),
  scheduledAt: z.string().optional(),
  timezone: z.string().optional()
});

export const scheduleCreateSchema = z.object({
  postId: z.number().int().positive(),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
  timezone: z.string().min(1, "Timezone is required")
});

export const templateCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  type: postTypeSchema,
  platforms: z.array(socialPlatformSchema).min(1, "Select at least one platform"),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});
