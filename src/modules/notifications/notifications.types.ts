import type { UserRole } from "../../types/user";

export type NotificationChannel = "IN_APP" | "EMAIL";
export type NotificationStatus = "QUEUED" | "SENT" | "READ";

export type QueueNotificationInput = {
  actorId: string;
  actorRole: UserRole;
  recipientId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
};

export type MarkNotificationReadInput = {
  actorId: string;
  notificationId: string;
};

export type Notification = {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: Date;
};
