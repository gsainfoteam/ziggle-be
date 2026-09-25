import { Prisma } from '@generated/prisma/client';

export type NoticeListContent = Prisma.NoticeGetPayload<{
  include: {
    tags: true;
    author: {
      select: {
        name: true;
        uuid: true;
        picture: true;
      };
    };
    files: true;
    reactions: true;
    reminders: true;
    group: true;
    UserRecord: {
      select: {
        isViewed: true;
        isBookmarked: true;
      };
    };
  };
}>;
