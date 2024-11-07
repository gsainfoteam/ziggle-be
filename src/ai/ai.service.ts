import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeadlineResponse } from './types/deadlineResponse.type';
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';
import { Loggable } from '@lib/logger/decorator/loggable';
import * as deepl from 'deepl-node';
import { TranslateResDto } from './dto/res/translateRes.dto';
import { TranslateDto } from './dto/req/translate.dto';

@Injectable()
@Loggable()
export class AiService {
  private readonly logger = new Logger(AiService.name, {
    timestamp: true,
  });
  private readonly openai: OpenAI;
  private readonly translator: deepl.Translator;
  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.translator = new deepl.Translator(
      this.configService.getOrThrow<string>('DEEPL_API_KEY'),
    );
  }

  async detectDeadline(body: string, createdAt: Date): Promise<Date | null> {
    const prompts: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          "## 당신의 목적\n당신은 공지글로부터 신청 마감 기한, 행사 시작 시간과 같은 deadline 정보를 알아내는 AI 봇입니다.\n\n## 입력 정보\n**공지의 생성 일자**와 **공지 본문**이 제공됩니다.\n\n## 출력 값\n만약, deadline을 알아내기에 정보가 충분하지 않다면 빈 문자열을 반환하고, 정보가 있다면 '%Y-%m-%d %H:%M:%S'의 datetime.datetime 형식의 string으로 deadline을 알려주세요.\n\n## 출력 형식\n다음과 같은 json 형태로 출력하세요 {'deadline': ''}",
      } as ChatCompletionSystemMessageParam,
      {
        role: 'user',
        content: `## 공지의 생성 일자\n${createdAt}\n\n## 공지 본문\n${body}. 이제 json 형식으로 deadline 정보를 추출해주세요.`,
      } as ChatCompletionUserMessageParam,
    ];
    try {
      const model = 'gpt-3.5-turbo-0125';
      const response = await this.askGPT(prompts, model);
      return response ? this.formatDate(response.deadline) : null;
    } catch (_) {
      const model = 'gpt-4o';
      const response = await this.askGPT(prompts, model);
      return response ? this.formatDate(response.deadline) : null;
    }
  }

  private formatDate(date: string): Date | null {
    if (date == '') {
      return null;
    }
    return new Date(date.split(' ').join('T') + '.000Z');
  }

  private async askGPT(
    prompts: ChatCompletionMessageParam[],
    model: string,
  ): Promise<DeadlineResponse | null> {
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        response_format: { type: 'json_object' },
        messages: prompts,
      });
      return response.choices[0].message.content
        ? JSON.parse(response.choices[0].message.content)
        : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async translate({
    text,
    targetLang,
  }: TranslateDto): Promise<TranslateResDto> {
    this.logger.log(`translate called`);
    const result = await this.translator
      .translateText(text, null, targetLang)
      .catch((error) => {
        this.logger.error(`deepl translation error: ${error.message}`);
        throw new InternalServerErrorException(error.message);
      });
    this.logger.log(`translate finished`);
    return {
      text: result.text,
      lang: targetLang,
    };
  }
}
