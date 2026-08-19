import { createHash } from "node:crypto";
import { aesGcmEncrypt, aesGcmDecrypt } from "./secrets.js";

export async function computeUuid(input: string): Promise<string> {
  return createHash("sha256").update(input).digest("hex").slice(0, 36);
}

export function generateMessageNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, "0");
  return `SOCIAL-${year}-${seq}`;
}

export function resolvePlatformLimits(platform: string): {
  maxContentLength: number;
  maxMediaCount: number;
  supportedMediaTypes: string[];
} {
  const limits: Record<string, { maxContentLength: number; maxMediaCount: number; supportedMediaTypes: string[] }> = {
    facebook: { maxContentLength: 63206, maxMediaCount: 10, supportedMediaTypes: ["image", "video"] },
    instagram: { maxContentLength: 2200, maxMediaCount: 10, supportedMediaTypes: ["image", "video", "carousel"] },
    twitter: { maxContentLength: 280, maxMediaCount: 4, supportedMediaTypes: ["image", "video", "gif"] },
    linkedin: { maxContentLength: 3000, maxMediaCount: 20, supportedMediaTypes: ["image", "video", "document"] },
    tiktok: { maxContentLength: 2200, maxMediaCount: 1, supportedMediaTypes: ["video"] },
    youtube: { maxContentLength: 5000, maxMediaCount: 1, supportedMediaTypes: ["video"] },
    pinterest: { maxContentLength: 500, maxMediaCount: 1, supportedMediaTypes: ["image"] }
  };

  return limits[platform] ?? { maxContentLength: 2000, maxMediaCount: 4, supportedMediaTypes: ["image"] };
}

export function validatePostContent(content: string, platform: string): string[] {
  const errors: string[] = [];
  const limits = resolvePlatformLimits(platform);

  if (content.length > limits.maxContentLength) {
    errors.push(`Content exceeds ${platform} limit of ${limits.maxContentLength} characters`);
  }

  if (content.trim().length === 0) {
    errors.push("Content cannot be empty");
  }

  return errors;
}

export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset"
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    if (offsetPart) {
      const match = offsetPart.value.match(/GMT([+-]\d+)?/);
      if (match) return Number(match[1] ?? 0);
    }
  } catch {
    // fallback
  }
  return 0;
}
