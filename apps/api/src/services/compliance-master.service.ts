import {
  db,
  complianceTemplates,
  regulatoryCalendarEvents,
  clients,
  memberships,
  eq,
  and,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class ComplianceMasterService {
  // ──────────── TEMPLATES ────────────
  static async createTemplate(
    tenantId: string,
    createdByMembershipId: string,
    data: {
      name: string;
      category: string;
      checklistData: unknown;
    },
  ) {
    const creator = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, createdByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!creator)
      throw new ApiError(
        403,
        "Invalid creator membership",
        "INVALID_MEMBERSHIP",
      );

    const [template] = await db
      .insert(complianceTemplates)
      .values({
        tenantId,
        name: data.name,
        category: data.category,
        checklistData: data.checklistData,
        createdByMembershipId,
      })
      .returning();

    return template;
  }

  static async getTemplates(tenantId: string, category?: string) {
    const filters = [eq(complianceTemplates.tenantId, tenantId)];
    if (category) {
      filters.push(eq(complianceTemplates.category, category));
    }

    return db
      .select()
      .from(complianceTemplates)
      .where(and(...filters));
  }

  // ──────────── CALENDAR ────────────
  static async createCalendarEvent(
    tenantId: string,
    createdByMembershipId: string,
    data: {
      clientId?: string;
      title: string;
      description?: string;
      eventDate: string;
      eventType: string;
    },
  ) {
    const creator = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.id, createdByMembershipId),
        eq(memberships.tenantId, tenantId),
      ),
    });
    if (!creator)
      throw new ApiError(
        403,
        "Invalid creator membership",
        "INVALID_MEMBERSHIP",
      );
    if (data.clientId) {
      const client = await db.query.clients.findFirst({
        where: and(
          eq(clients.id, data.clientId),
          eq(clients.tenantId, tenantId),
        ),
      });
      if (!client)
        throw new ApiError(404, "Client not found", "CLIENT_NOT_FOUND");
    }

    const [event] = await db
      .insert(regulatoryCalendarEvents)
      .values({
        tenantId,
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        eventType: data.eventType,
        createdByMembershipId,
        status: "upcoming",
      })
      .returning();

    return event;
  }

  static async getCalendarEvents(tenantId: string, clientId?: string) {
    const filters = [eq(regulatoryCalendarEvents.tenantId, tenantId)];
    if (clientId) {
      filters.push(eq(regulatoryCalendarEvents.clientId, clientId));
    }

    return db
      .select()
      .from(regulatoryCalendarEvents)
      .where(and(...filters))
      .orderBy(regulatoryCalendarEvents.eventDate); // Ascending order
  }
}
