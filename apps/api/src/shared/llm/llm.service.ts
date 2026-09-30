import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CustomConfigService } from '@lib/custom-config';
import {
  buildNoticeSummaryUserPrompt,
  NOTICE_SUMMARY_SYSTEM_PROMPT,
} from './llm.prompts';

export interface NoticeSummary {
  summary: string;
  keywords: string[];
}

@Injectable()
export class LlmService {
  private client: OpenAI;

  constructor(private configService: CustomConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.LETSUR_API_KEY,
      baseURL: this.configService.LETSUR_GATEWAY_URL,
    });
  }

  async summarize(
    text: string,
    deadline: Date | null = null,
  ): Promise<NoticeSummary> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to summarize cannot be empty');
    }

    const deadlineDate = deadline?.toISOString().slice(0, 10);
    const deadlineDateLabel = deadline
      ? `${deadline.getUTCFullYear()}년 ${deadline.getUTCMonth() + 1}월 ${deadline.getUTCDate()}일`
      : null;
    const response = await this.client.chat.completions.create({
      model: this.configService.LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: NOTICE_SUMMARY_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildNoticeSummaryUserPrompt(text, deadlineDateLabel),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'notice_summary',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              keywords: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['summary', 'keywords'],
            additionalProperties: false,
          },
        },
      },
      max_completion_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Failed to generate summary and keywords');
    }

    let result: unknown;
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error('Failed to parse generated summary and keywords');
    }

    if (
      !result ||
      typeof result !== 'object' ||
      !('summary' in result) ||
      typeof result.summary !== 'string' ||
      !('keywords' in result) ||
      !Array.isArray(result.keywords)
    ) {
      throw new Error('Generated summary and keywords have an invalid format');
    }

    const parsed = result as { summary: string; keywords: unknown[] };
    let summary = parsed.summary.trim();
    if (!summary) {
      throw new Error('Failed to generate summary');
    }

    if (deadlineDate && deadlineDateLabel) {
      summary = summary.replaceAll(deadlineDate, deadlineDateLabel);
      if (!summary.includes(deadlineDateLabel)) {
        summary = `${summary} 마감일은 ${deadlineDateLabel}입니다.`;
      }
    }

    const keywords = [
      ...new Set(
        parsed.keywords
          .filter((keyword): keyword is string => typeof keyword === 'string')
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      ),
    ].slice(0, 12);
    if (keywords.length === 0) {
      throw new Error('Failed to generate search keywords');
    }

    if (summary.length > 500) {
      if (
        deadlineDateLabel &&
        !summary.substring(0, 497).includes(deadlineDateLabel)
      ) {
        const deadlineSuffix = `마감일은 ${deadlineDateLabel}입니다.`;
        const summaryLength = 500 - deadlineSuffix.length - 4;
        summary = `${summary.substring(0, summaryLength).trimEnd()}... ${deadlineSuffix}`;
      } else {
        summary = `${summary.substring(0, 497)}...`;
      }
    }

    return { summary, keywords };
  }
}
