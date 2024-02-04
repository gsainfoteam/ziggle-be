import { Prisma } from '@prisma/client';

export type NoticeFullcontent = Prisma.NoticeGetPayload<{
  include: {
    contents: true;
    cralws: true;
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
  };
}>;
