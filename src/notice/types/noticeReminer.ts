import { Prisma } from '@prisma/client';

export type NoticeReminder = Prisma.NoticeGetPayload<{
  include: {
    contents: true;
    files: true;
    reminders: {
      include: {
        fcmTokens: true;
      };
    };
  };
}>;
