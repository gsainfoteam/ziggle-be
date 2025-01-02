import { FcmTargetUser } from './fcmTargetUser.type';
import { Notification } from 'firebase-admin/messaging';

export type QueueDataType = {
  targetUser: FcmTargetUser;
  notification: Notification;
  data?: Record<string, string>;
};
