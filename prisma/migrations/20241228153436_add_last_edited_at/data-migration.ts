// This file is a data migration that updates the `lastEditedAt` field of all `Notice` records to the value of the `updatedAt` field.
// To run this migration, use the following command:
// npx ts-node ./prisma/migrations/20241228153436_add_last_edited_at/data-migration.ts

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../../generated/prisma/client/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction(
    async (tx) => {
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
    },
    {
      maxWait: 5000, // default: 2000
      timeout: 1000000, // default: 5000
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
    },
  );
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
