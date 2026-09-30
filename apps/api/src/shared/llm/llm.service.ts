import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CustomConfigService } from '@lib/custom-config';

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

  async summarize(text: string): Promise<NoticeSummary> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to summarize cannot be empty');
    }

    const response = await this.client.chat.completions.create({
      model: this.configService.LLM_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You summarize Korean notice content for future semantic and keyword search. Return only a valid JSON object with exactly two fields: "summary" (a concise Korean summary of at most 500 characters) and "keywords" (an array of 3 to 12 short strings). Preserve exact searchable terms from the source in keywords, including organization and program names, people, locations, target audiences, topics, dates, deadlines, and application or event names. Do not put keywords or a keyword label in the summary. Do not add information that is not present in the source. Avoid duplicate or overly broad keywords.',
        },
        {
          role: 'user',
          content: `다음 공지 내용을 요약하고, 검색에 유용한 키워드를 별도의 배열로 추출해 주세요. 요약과 키워드를 한 필드에 섞지 말고 지정한 JSON 형식으로만 답변해 주세요.\n\n${text}`,
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
    const summary = parsed.summary.trim();
    if (!summary) {
      throw new Error('Failed to generate summary');
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

    return {
      summary:
        summary.length > 500 ? `${summary.substring(0, 497)}...` : summary,
      keywords,
    };
  }
}
