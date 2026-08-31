import {
  db,
  complianceTemplates,
  regulatoryCalendarEvents,
  eq,
  and,
} from "@avenquis/database";

export class ComplianceMasterService {
  // ──────────── TEMPLATES ────────────
  static async createTemplate(
    tenantId: string,
    createdByMembershipId: string,
    data: {
      name: string;
      category: string;
      checklistData: any;
    },
  ) {
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
