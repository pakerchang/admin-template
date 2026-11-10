import type { TGrant, TGrantMatrix } from "@/shared/permission";

/** 架構 spec §6.1 的角色清單；`TRoleRegistry` 由此收窄 mockGrants / coreGrants 的 key（OD-TYPE-6 A） */
export const coreRoles = [
  "superadmin",
  "admin",
  "support",
  "partner",
  "premium",
  "user",
  "guest",
] as const;

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TRoleRegistry extends Record<(typeof coreRoles)[number], true> {}
}

/** core 角色預設 grant（spec §6.1）；module 的 `permissions.mockGrants` 由 build() 併入 */
export const coreGrants = {
  superadmin: ["*"],
  admin: ["app:access"],
  support: ["app:access"],
  partner: ["app:access"],
} as const satisfies TGrantMatrix;

/** matrix[role] = coreGrants[role] ∪ ⋃ modules.mockGrants[role] */
export const mergeGrants = (
  ...matrices: TGrantMatrix[]
): Record<string, readonly TGrant[]> => {
  const out: Record<string, TGrant[]> = {};
  for (const m of matrices)
    for (const [role, grants] of Object.entries(m))
      out[role] = [...new Set([...(out[role] ?? []), ...(grants ?? [])])];
  return out;
};
