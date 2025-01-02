import { Notification } from 'firebase-admin/messaging';

export type Content = {
  notification: Notification;
  data?: Record<string, string>;
};
