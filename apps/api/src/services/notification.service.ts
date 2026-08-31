import {
  db,
  notifications,
  activityFeedEvents,
  memberships,
  userProfiles,
  eq,
  and,
  desc,
  count,
} from "@avenquis/database";
import { ApiError } from "../errors/api-error.js";

export class NotificationService {
  static async listNotifications(
    tenantId: string,
    recipientMembershipId: string,
    options?: {
      isRead?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.recipientMembershipId, recipientMembershipId),
    ];

    if (options?.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, options.isRead));
    }

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notifications.createdAt));

    return rows;
  }

  static async getUnreadCount(tenantId: string, recipientMembershipId: string) {
    const [row] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.recipientMembershipId, recipientMembershipId),
          eq(notifications.isRead, false),
        ),
      );

    return { unreadCount: Number(row?.count ?? 0) };
  }

  static async createNotification(
    tenantId: string,
    data: {
      recipientMembershipId: string;
      title: string;
      message: string;
      type: string;
      link?: string;
    },
  ) {
    const [notif] = await db
      .insert(notifications)
      .values({
        tenantId,
        recipientMembershipId: data.recipientMembershipId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        isRead: false,
      })
      .returning();

    return notif;
  }

  static async markAsRead(
    tenantId: string,
    notificationId: string,
    recipientMembershipId: string,
  ) {
    const notif = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.id, notificationId),
        eq(notifications.recipientMembershipId, recipientMembershipId),
      ),
    });

    if (!notif) {
      throw new ApiError(
        404,
        "Notification not found",
        "NOTIFICATION_NOT_FOUND",
      );
    }

    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.id, notificationId),
        ),
      )
      .returning();

    return updated;
  }

  static async markAllAsRead(tenantId: string, recipientMembershipId: string) {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.recipientMembershipId, recipientMembershipId),
          eq(notifications.isRead, false),
        ),
      );

    return { success: true };
  }

  static async listActivityFeed(
    tenantId: string,
    options?: {
      entityType?: string;
      entityId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const conditions = [eq(activityFeedEvents.tenantId, tenantId)];

    if (options?.entityType) {
      conditions.push(eq(activityFeedEvents.entityType, options.entityType));
    }
    if (options?.entityId) {
      conditions.push(eq(activityFeedEvents.entityId, options.entityId));
    }

    const rows = await db
      .select({
        id: activityFeedEvents.id,
        tenantId: activityFeedEvents.tenantId,
        actorMembershipId: activityFeedEvents.actorMembershipId,
        actorFullName: userProfiles.fullName,
        entityType: activityFeedEvents.entityType,
        entityId: activityFeedEvents.entityId,
        action: activityFeedEvents.action,
        description: activityFeedEvents.description,
        metadata: activityFeedEvents.metadata,
        createdAt: activityFeedEvents.createdAt,
      })
      .from(activityFeedEvents)
      .innerJoin(
        memberships,
        eq(activityFeedEvents.actorMembershipId, memberships.id),
      )
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(activityFeedEvents.createdAt));

    return rows;
  }

  static async logActivityEvent(
    tenantId: string,
    actorMembershipId: string,
    data: {
      entityType: string;
      entityId: string;
      action: string;
      description: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const [event] = await db
      .insert(activityFeedEvents)
      .values({
        tenantId,
        actorMembershipId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        description: data.description,
        metadata: data.metadata,
      })
      .returning();

    return event;
  }
}
