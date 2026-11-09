import type { TPermission } from "./types";

export class ForbiddenError extends Error {
  constructor(public permission: TPermission) {
    super(`forbidden: requires ${permission}`);
  }
}
