import { UserCog } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import { teamMembersMockHandlers } from "./mocks/handlers";
import { teamMembersRoutes } from "./model/routes";
import TeamMemberListPage from "./ui/TeamMemberList";

const teamMembersPermissions = definePermissions({
  "team-members": z.enum(["read", "create", "update", "delete"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof teamMembersPermissions.schema>,
    true
  > {}
}

export default defineModule({
  id: "team-members",
  kind: "generic",
  mockHandlers: teamMembersMockHandlers,
  routes: (ctx) => teamMembersRoutes(ctx, { list: TeamMemberListPage }),
  nav: [
    {
      id: "team-members",
      label: "dashboard.menu.teamMembers.title",
      to: "/team-members",
      icon: UserCog,
      permission: "team-members:read",
      order: 20,
    },
  ],
  permissions: {
    ...teamMembersPermissions,
    mockGrants: {
      admin: ["team-members:*"],
      support: ["team-members:read"],
      partner: ["team-members:read"],
    },
  },
});
