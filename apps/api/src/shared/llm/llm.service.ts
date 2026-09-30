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
          content:
            'Write a short, natural Korean notice summary for display to end users. The summary must read as fluent, standalone prose, usually one to three sentences, in a clear and polite Korean style ending in 합니다 or 입니다. Explain what the notice is about, who it applies to, and what readers need to do when those facts are available. Avoid fragments, keyword stuffing, headings, labels, internal metadata, Markdown, emojis, exaggerated promotional language, and unnecessary introductions such as "이 공지는". Keep it within 500 characters. Preserve important facts and dates. Always examine the source for deadlines and the last date on which its information, service, benefit, or offer remains valid, even when no separate deadline metadata is provided. When such dates are stated, include them in the summary itself, not just in keywords, and explain what each date applies to. Prioritize these dates over less important details and place them early enough to remain within the character limit. If the source gives an application, recruitment, or event period, include its full start and end dates in natural Korean date wording. If a deadline is provided separately, always include it naturally in the summary using Korean date wording. Do not infer missing dates or years, or describe an event end date as an application deadline. Do not put a keyword list in the summary. Return only a valid JSON object with exactly two fields: "summary" (the user-facing text) and "keywords" (an array of 3 to 12 short strings). Preserve exact searchable terms from the source in keywords, including organization and program names, people, locations, target audiences, topics, dates, deadlines, and application or event names. Do not add information that is not present in the source or provided deadline metadata. Avoid duplicate or overly broad keywords.',
        },
        {
          role: 'user',
          content: `다음 공지를 사용자에게 보여줄 자연스럽고 읽기 쉬운 한국어 문장으로 요약하고, 검색에 유용한 키워드는 별도의 배열로 추출해 주세요. 별도로 지정된 마감일이 없어도 본문에 마감 기한이나 정보가 유효한 마지막 날짜가 있다면, 무엇의 마감일 또는 종료일인지 요약 문장에 반드시 포함해 주세요. 요약에는 키워드 목록이나 내부 메타데이터를 넣지 말고, 지정한 JSON 형식으로 답변해 주세요.${deadlineDateLabel ? `\n\n공지 마감일: ${deadlineDateLabel}. 이 마감일을 요약의 한국어 문장 안에 반드시 포함해 주세요.` : ''}\n\n${text}`,
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
