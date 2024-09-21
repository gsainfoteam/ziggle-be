import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AiService } from './ai.service';
import {
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IdPGuard } from 'src/user/guard/idp.guard';
import { TranslateDto } from './dto/req/translate.dto';
import { TranslateResDto } from './dto/res/translateRes.dto';

@ApiTags('ai')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@UseGuards(IdPGuard)
@Controller('ai')
@UsePipes(new ValidationPipe({ transform: true }))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({
    summary: 'Translate text',
    description: 'Translate text to target language',
  })
  @ApiOkResponse({
    type: TranslateResDto,
  })
  @ApiInternalServerErrorResponse()
  @Post('translate')
  async translate(
    @Body() translateDto: TranslateDto,
  ): Promise<TranslateResDto> {
    return {
      text: translateDto.text,
      lang: translateDto.targetLang,
    };
  }
}
