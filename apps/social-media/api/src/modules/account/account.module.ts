import type { FastifyInstance } from "fastify";
import { defineModule } from "@cxapp/framework/modules";
import { registerAccountRoutes } from "./account.routes.js";
import type { SocialMediaModuleDependencies } from "../_shared/types.js";

export function createAccountModule(dependencies: SocialMediaModuleDependencies) {
  return defineModule<{ app: FastifyInstance }>({
    key: "social.account",
    label: "Social Accounts",
    register: ({ app }) => registerAccountRoutes(app, dependencies)
  });
}
