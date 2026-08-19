import type { FastifyInstance } from "fastify";
import { defineModule } from "@cxapp/framework/modules";
import { registerScheduleRoutes } from "./schedule.routes.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

export function createScheduleModule(dependencies: SocialMediaModuleDependencies) {
  return defineModule<{ app: FastifyInstance }>({
    key: "social.schedule",
    label: "Social Schedule",
    register: ({ app }) => registerScheduleRoutes(app, dependencies)
  });
}
