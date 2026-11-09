import type { TGrant, TGrantMatrix } from "@/shared/permission";

/** core 角色預設 grant（spec §6.1）；module 的 `permissions.mockGrants` 由 build() 併入 */
export const coreGrants: TGrantMatrix = {
  superadmin: ["*"],
  admin: ["app:access"],
  support: ["app:access"],
  partner: ["app:access"],
};

/** matrix[role] = coreGrants[role] ∪ ⋃ modules.mockGrants[role] */
export const mergeGrants = (...matrices: TGrantMatrix[]): TGrantMatrix => {
  const out: Record<string, TGrant[]> = {};
  for (const m of matrices)
    for (const [role, grants] of Object.entries(m))
      out[role] = [...new Set([...(out[role] ?? []), ...grants])];
  return out;
};
