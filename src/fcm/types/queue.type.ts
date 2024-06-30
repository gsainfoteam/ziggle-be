import { FcmTargetUser } from './fcmTargetUser.type';

export type QueueDataType = {
  targetUser: FcmTargetUser;
  notification: Notification;
  data?: Record<string, string>;
};
