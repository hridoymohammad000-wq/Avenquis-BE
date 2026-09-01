import { tenants, memberships } from "@avenquis/database";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        aal: "aal1" | "aal2";
      };
      authToken?: string;
      tenantId?: string;
      tenant?: typeof tenants.$inferSelect;
      membership?: typeof memberships.$inferSelect;
      permissions?: string[];
    }
  }
}
