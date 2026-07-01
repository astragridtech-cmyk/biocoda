import type { Session } from "./db.js";

/**
 * Session for machine clients (the Expo app). Reads tenant/role from headers,
 * falling back to the demo defaults. Production validates a bearer token here.
 */
export function apiSession(req: Request): Session {
  return {
    tenantId:
      req.headers.get("x-bc-tenant") ??
      process.env.DEFAULT_TENANT ??
      "rb-natural-trust",
    role: req.headers.get("x-bc-role") ?? "ecologist",
  };
}

export const DEMO_ECOLOGIST_ID = "user-eco-1";
