import { Notification } from 'firebase-admin/messaging';

export type QueueDataType = {
  tokens: string[];
  notification: Notification;
  data?: Record<string, string>;
};
