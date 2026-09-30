import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
export class LlmService {
  private client: OpenAI;

  constructor(private configService: CustomConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.LETSUR_API_KEY,
      baseURL: this.configService.LETSUR_GATEWAY_URL,
    });
  }

  async summarize(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to summarize cannot be empty');
    }

    const response = await this.client.chat.completions.create({
      model: this.configService.LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text concisely in Korean. Keep summaries to 500 characters or less.',
        },
        {
          role: 'user',
          content: `Please summarize the following text concisely in Korean, keeping it to 500 characters or less:\n\n${text}`,
        },
      ],
      max_completion_tokens: 1000,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) {
      throw new Error('Failed to generate summary');
    }

    if (summary.length > 500) {
      return summary.substring(0, 497) + '...';
    }

    return summary;
  }
}
