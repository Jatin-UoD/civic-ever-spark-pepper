export const ANALYTICS_ROLES = Object.freeze([
  "canteen_admin",
  "institution_admin",
  "super_admin",
]);

const ROLE_BY_MEMBERSHIP = Object.freeze({
  CANTEEN_ADMIN: "canteen_admin",
  INSTITUTION_ADMIN: "institution_admin",
  SUPER_ADMIN: "super_admin",
});

export class ForbiddenError extends Error {
  constructor() {
    super("You do not have access to these analytics.");
    this.name = "ForbiddenError";
    this.status = 403;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("The requested analytics record was not found.");
    this.name = "NotFoundError";
    this.status = 404;
  }
}

/** @param {unknown} role */
export function canViewAnalytics(role) {
  return typeof role === "string" && ANALYTICS_ROLES.includes(role);
}

/** @param {string} role */
export function analyticsRoleForMembership(role) {
  switch (role) {
    case "CANTEEN_ADMIN": return ROLE_BY_MEMBERSHIP.CANTEEN_ADMIN;
    case "INSTITUTION_ADMIN": return ROLE_BY_MEMBERSHIP.INSTITUTION_ADMIN;
    case "SUPER_ADMIN": return ROLE_BY_MEMBERSHIP.SUPER_ADMIN;
    default: return null;
  }
}
