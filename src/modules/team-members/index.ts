import { UserCog } from "lucide-react";

import { defineModule } from "@/shared/module";

import { teamMembersMockHandlers } from "./mocks/handlers";
import { teamMembersRoutes } from "./model/routes";
import TeamMemberListPage from "./ui/TeamMemberList";

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
    resources: { "team-members": ["read", "create", "update", "delete"] },
    mockGrants: {
      admin: ["team-members:*"],
      support: ["team-members:read"],
      partner: ["team-members:read"],
    },
  },
});
