import { Prisma } from '@prisma/client';

export type NoticeFullcontent = Prisma.NoticeGetPayload<{
  include: {
    contents: true;
    tags: true;
    author: {
      select: {
        name: true;
      };
    };
    files: true;
    reminders: true;
  };
}>;
