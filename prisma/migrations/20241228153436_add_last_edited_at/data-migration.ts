// This file is a data migration that updates the `lastEditedAt` field of all `Notice` records to the value of the `updatedAt` field.
// To run this migration, use the following command:
// npx ts-node ./prisma/migrations/20241228153436_add_last_edited_at/data-migration.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const notices = await tx.notice.findMany();
    for (const notice of notices) {
      await tx.notice.update({
        where: { id: notice.id },
        data: { lastEditedAt: notice.updatedAt, updatedAt: notice.updatedAt },
      });
      console.log(
        `Updated notice ${notice.id} lastEditedAt to ${notice.updatedAt}`,
      );
    }
  });
}

main()
  .then(async () => {
    console.log('Data migration completed successfully');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
