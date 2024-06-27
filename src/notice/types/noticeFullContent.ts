import { Prisma } from '@prisma/client';

export type NoticeFullContent = Prisma.NoticeGetPayload<{
  include: {
    contents: true;
    crawls: true;
    tags: true;
    author: {
      select: {
        name: true;
        uuid: true;
      };
    };
    files: true;
    reactions: true;
    reminders: true;
    group: true;
  };
}>;
