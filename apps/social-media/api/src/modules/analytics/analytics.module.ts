import type { FastifyInstance } from "fastify";
import { defineModule } from "@cxapp/framework/modules";
import { registerAnalyticsRoutes } from "./analytics.routes.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

export function createAnalyticsModule(dependencies: SocialMediaModuleDependencies) {
  return defineModule<{ app: FastifyInstance }>({
    key: "social.analytics",
    label: "Social Analytics",
    register: ({ app }) => registerAnalyticsRoutes(app, dependencies)
  });
}
