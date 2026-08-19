import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function seedSocialMediaPermissions(db: Kysely<unknown>) {
  const permissions = [
    { key: "social.accounts.manage", label: "Manage Social Accounts" },
    { key: "social.posts.manage", label: "Manage Social Posts" },
    { key: "social.schedules.manage", label: "Manage Social Schedules" },
    { key: "social.analytics.view", label: "View Social Analytics" },
    { key: "social.templates.manage", label: "Manage Social Templates" }
  ];

  for (const perm of permissions) {
    const uuid = await computeUuid(`perm:${perm.key}`);
    await db
      .insertInto("app_permissions" as never)
      .values({
        uuid,
        key: perm.key,
        label: perm.label,
        createdAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      } as never)
      .onConflict((oc) => oc.column("uuid").doNothing())
      .execute();
  }

  const adminRoleUuid = await computeUuid("role:admin");
  for (const perm of permissions) {
    const permUuid = await computeUuid(`perm:${perm.key}`);
    const rolePermUuid = await computeUuid(`roleperm:admin:${perm.key}`);
    await db
      .insertInto("app_role_permissions" as never)
      .values({
        uuid: rolePermUuid,
        roleUuid: adminRoleUuid,
        permissionUuid: permUuid,
        createdAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      } as never)
      .onConflict((oc) => oc.column("uuid").doNothing())
      .execute();
  }
}

async function computeUuid(input: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(input).digest("hex").slice(0, 36);
}
