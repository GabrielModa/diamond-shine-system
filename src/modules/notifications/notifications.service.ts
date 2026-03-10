import type { UserRole } from "../../types/user";
import type { MarkNotificationReadInput, Notification, QueueNotificationInput } from "./notifications.types";

type NotificationRecord = Notification;

type NotificationsDeps = {
  notification: {
    create: (args: { data: Omit<NotificationRecord, "id" | "createdAt" | "status"> & { status: "QUEUED" } }) => Promise<NotificationRecord>;
    update: (args: { where: { id: string; recipientId: string }; data: { status: "READ" } }) => Promise<NotificationRecord>;
  };
};

function assertCanQueueNotification(role: UserRole) {
  if (role === "VIEWER") {
    throw new Error("Viewers cannot queue notifications.");
  }
}

export function createNotificationsService(deps: NotificationsDeps) {
  return {
    async queueNotification(input: QueueNotificationInput): Promise<Notification> {
      assertCanQueueNotification(input.actorRole);

      return deps.notification.create({
        data: {
          channel: input.channel,
          message: input.message,
          recipientId: input.recipientId,
          status: "QUEUED",
          title: input.title,
        },
      });
    },

    async markAsRead(input: MarkNotificationReadInput): Promise<Notification> {
      return deps.notification.update({
        data: {
          status: "READ",
        },
        where: {
          id: input.notificationId,
          recipientId: input.actorId,
        },
      });
    },
  };
}

export function createNotificationsServiceFromPrisma(prisma: NotificationsDeps) {
  return createNotificationsService(prisma);
}
