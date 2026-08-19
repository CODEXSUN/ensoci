import type { FastifyInstance } from "fastify";
import { defineModule } from "@cxapp/framework/modules";
import { registerTemplateRoutes } from "./template.routes.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

export function createTemplateModule(dependencies: SocialMediaModuleDependencies) {
  return defineModule<{ app: FastifyInstance }>({
    key: "social.template",
    label: "Social Templates",
    register: ({ app }) => registerTemplateRoutes(app, dependencies)
  });
}
