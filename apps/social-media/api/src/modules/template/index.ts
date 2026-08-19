export type {
  SocialTemplate,
  SocialTemplateCreatePayload,
  SocialTemplateUpdatePayload,
  TemplateMedia
} from "../_shared/types.js";

export { SocialTemplateRepository } from "./template.repository.js";
export { SocialTemplateService } from "./template.service.js";
export { createTemplateModule } from "./template.module.js";
export { socialTemplateEvents } from "./template.events.js";
