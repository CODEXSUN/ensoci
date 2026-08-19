import type { FastifyInstance } from "fastify";
import { registerModules } from "@cxapp/framework/modules";
import { createAccountModule } from "./modules/account/account.module.js";
import { createPostModule } from "./modules/post/post.module.js";
import { createScheduleModule } from "./modules/schedule/schedule.module.js";
import { createAnalyticsModule } from "./modules/analytics/analytics.module.js";
import { createTemplateModule } from "./modules/template/template.module.js";
import type { SocialMediaModuleDependencies } from "./modules/_shared/types.js";

export const socialMediaModuleKeys = [
  "social.account",
  "social.post",
  "social.schedule",
  "social.analytics",
  "social.template"
] as const;

export async function registerSocialMediaApi(
  app: FastifyInstance,
  dependencies: SocialMediaModuleDependencies
) {
  const accountModule = createAccountModule(dependencies);
  const postModule = createPostModule(dependencies);
  const scheduleModule = createScheduleModule(dependencies);
  const analyticsModule = createAnalyticsModule(dependencies);
  const templateModule = createTemplateModule(dependencies);

  await registerModules(
    [accountModule, postModule, scheduleModule, analyticsModule, templateModule],
    { app },
    {
      onRegister: (module) => console.info(`[social-media.register] ${module.key}`),
      onReady: (module) => console.info(`[social-media.ready] ${module.key}`)
    }
  );
}

export type { SocialMediaModuleDependencies, SocialMediaRuntimeContext } from "./modules/_shared/types.js";
export type {
  SocialAccount,
  SocialPost,
  SocialSchedule,
  SocialAnalytics,
  SocialTemplate,
  SocialPlatform,
  PostStatus,
  PostType,
  ScheduleStatus,
  AnalyticsPeriod
} from "./modules/_shared/types.js";
