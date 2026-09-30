import { PrismaClient } from '@generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillSummaries() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const llmClient = new OpenAI({
    apiKey: process.env.LETSUR_API_KEY,
    baseURL: process.env.LETSUR_GATEWAY_URL,
  });

  try {
    // Fetch all notices without summary
    const totalNoticesToProcess = await prisma.notice.count({
      where: {
        summary: null,
        deletedAt: null,
      },
    });

    console.log(`Found ${totalNoticesToProcess} notices to summarize`);

    let processed = 0;
    let batchSize = 50;

    while (processed < totalNoticesToProcess) {
      const notices = await prisma.notice.findMany({
        where: {
          summary: null,
          deletedAt: null,
        },
        include: {
          contents: {
            select: { lang: true, body: true },
            orderBy: { id: 'asc' },
          },
          crawls: {
            select: { body: true },
            orderBy: { id: 'asc' },
          },
        },
        take: batchSize,
        skip: 0,
      });

      if (notices.length === 0) {
        break;
      }

      for (const notice of notices) {
        try {
          // Get content to summarize
          let contentToSummarize = '';
          if (notice.crawls.length > 0) {
            contentToSummarize = notice.crawls[0].body;
          } else if (notice.contents.length > 0) {
            contentToSummarize = notice.contents[0].body;
          }

          if (!contentToSummarize) {
            console.log(`Notice ${notice.id}: No content to summarize`);
            processed++;
            continue;
          }

          // Generate summary
          const response = await llmClient.chat.completions.create({
            model: process.env.LLM_MODEL!,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that summarizes text concisely in Korean. Keep summaries to 500 characters or less.',
              },
              {
                role: 'user',
                content: `Please summarize the following text concisely in Korean, keeping it to 500 characters or less:\n\n${contentToSummarize}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 200,
          });

          let summary = response.choices[0]?.message?.content?.trim() || '';

          if (!summary) {
            console.log(`Notice ${notice.id}: Failed to generate summary`);
            processed++;
            continue;
          }

          if (summary.length > 500) {
            summary = summary.substring(0, 497) + '...';
          }

          // Update notice with summary
          await prisma.notice.update({
            where: { id: notice.id },
            data: { summary },
          });

          console.log(`✓ Notice ${notice.id}: Summary added (${summary.length} chars)`);
          processed++;

          // Rate limiting: wait 100ms between requests
          await sleep(100);
        } catch (error) {
          console.error(`✗ Notice ${notice.id}: Error -`, error instanceof Error ? error.message : String(error));
          processed++;
        }
      }

      console.log(`Progress: ${processed}/${totalNoticesToProcess}`);
    }

    console.log(`\n✓ Backfill completed! Processed ${processed} notices.`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

backfillSummaries();
