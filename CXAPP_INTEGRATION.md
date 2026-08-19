/**
 * CXApp Integration - Social Media Manager
 *
 * This file provides the integration points for adding the Social Media module
 * to the cxapp platform. Apply these changes to the cxapp repository to enable
 * the social media manager as a platform app.
 */

// ============================================================================
// 1. Add to cxapp/apps/platform/api/package.json dependencies:
//    "@ensoci/social-media-api": "^1.0.0"
//
// 2. Add to cxapp/apps/platform/web/package.json dependencies:
//    "@ensoci/social-media-web": "^1.0.0"
//
// 3. Add to cxapp/tsconfig.json references:
//    { "path": "./apps/social-media/api" }
//    { "path": "./apps/social-media/web" }
//
// 4. Add to cxapp/package.json workspaces (if not using the existing apps/* pattern):
//    "apps/social-media/*"
// ============================================================================

// ============================================================================
// PLATFORM API INTEGRATION
// Add to: cxapp/apps/platform/api/src/app.ts
// ============================================================================

/*
import {
  registerSocialMediaApi,
  socialMediaModuleKeys
} from "@ensoci/social-media-api";

// Inside createApp(), after existing API registrations:
await registerSocialMediaApi(app, {
  enqueue: (payload) => queueService.enqueue(payload),
  resolveContext: socialMediaContext,
  secretKey: env.JWT_SECRET
});

// Add social media module keys to healthChecks:
socialMediaModuleKeys

// Add social media context resolver:
async function socialMediaContext(request: FastifyRequest) {
  const context = tenantAccessContext(request);
  return {
    ...context,
    database: context.database as never,
    companyId: Number(request.headers["x-company-id"] ?? 0)
  };
}
*/

// ============================================================================
// PLATFORM WEB INTEGRATION
// Add to: cxapp/apps/platform/web/src/desks/tenant/AppDesk.tsx
// ============================================================================

/*
// Add lazy loaders (near other module loaders):
const loadSocialMediaDashboard = () => import("@ensoci/social-media-web/modules/dashboard");
const loadSocialMediaAccounts = () => import("@ensoci/social-media-web/modules/account");
const loadSocialMediaPosts = () => import("@ensoci/social-media-web/modules/post");
const loadSocialMediaSchedule = () => import("@ensoci/social-media-web/modules/schedule");
const loadSocialMediaAnalytics = () => import("@ensoci/social-media-web/modules/analytics");
const loadSocialMediaTemplates = () => import("@ensoci/social-media-web/modules/template");

// Create lazy workspace components:
const SocialMediaDashboard = lazyWorkspace(() =>
  loadSocialMediaDashboard().then((m) => m.DashboardWorkspace)
);
const SocialMediaAccounts = lazyWorkspace(() =>
  loadSocialMediaAccounts().then((m) => m.AccountWorkspace)
);
const SocialMediaPosts = lazyWorkspace(() =>
  loadSocialMediaPosts().then((m) => m.PostWorkspace)
);
const SocialMediaSchedule = lazyWorkspace(() =>
  loadSocialMediaSchedule().then((m) => m.ScheduleWorkspace)
);
const SocialMediaAnalytics = lazyWorkspace(() =>
  loadSocialMediaAnalytics().then((m) => m.AnalyticsWorkspace)
);
const SocialMediaTemplates = lazyWorkspace(() =>
  loadSocialMediaTemplates().then((m) => m.TemplateWorkspace)
);

// Add to Suspense rendering (near other page conditions):
{safePage === "social-media." || safePage === "social-media.dashboard" ? (
  <SocialMediaDashboard />
) : null}
{safePage === "social-media.accounts" ? <SocialMediaAccounts /> : null}
{safePage === "social-media.posts" ? <SocialMediaPosts /> : null}
{safePage === "social-media.schedule" ? <SocialMediaSchedule /> : null}
{safePage === "social-media.analytics" ? <SocialMediaAnalytics /> : null}
{safePage === "social-media.templates" ? <SocialMediaTemplates /> : null}
*/

// ============================================================================
// APP REGISTRY INTEGRATION
// Add to: cxapp/apps/platform/web/src/app/app-registry.ts
// ============================================================================

/*
// Add to PlatformAppId type:
export type PlatformAppId = "application" | "billing" | "accounts" | "devkit" | "mail" | "task-manager" | "social-media";

// Add to defaultTenantModuleKeys:
"social-media.dashboard",
"social-media.accounts",
"social-media.posts",
"social-media.schedule",
"social-media.analytics",
"social-media.templates"
*/

// ============================================================================
// APP REGISTRY STACK INTEGRATION
// Add to: cxapp/apps/platform/web/src/modules/app-registry/app-registry.types.ts
// ============================================================================

/*
export type PlatformApp = {
  // ...existing fields...
  stack: "platform" | "billing" | "devkit" | "mail" | "platform-task-manager" | "social-media";
};

// Add to app-registry.schema.ts stack enum:
stack: z.enum(["platform", "billing", "devkit", "mail", "platform-task-manager", "social-media"])
*/

// ============================================================================
// VITE PROXY INTEGRATION
// Add to: cxapp/apps/platform/web/vite.config.ts
// ============================================================================

/*
// Add proxy configuration:
"/api/social": {
  target: `http://localhost:${PLATFORM_API_PORT}`,
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\\/api\\/social/, "/social")
}
*/

// ============================================================================
// TURBO.JSON GLOBAL ENV (if adding new env vars)
// ============================================================================

/*
No additional env vars needed for the social media module.
Uses existing CXAPP_REDIS_URL for queue processing.
*/
