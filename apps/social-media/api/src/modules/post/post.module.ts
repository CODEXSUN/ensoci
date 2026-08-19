import type { FastifyInstance } from "fastify";
import { defineModule } from "@cxapp/framework/modules";
import { registerPostRoutes } from "./post.routes.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

export function createPostModule(dependencies: SocialMediaModuleDependencies) {
  return defineModule<{ app: FastifyInstance }>({
    key: "social.post",
    label: "Social Posts",
    register: ({ app }) => registerPostRoutes(app, dependencies)
  });
}
