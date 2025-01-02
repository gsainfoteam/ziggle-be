import { Injectable } from '@nestjs/common';
import { NoticeFullContent } from './types/noticeFullContent';
import { GeneralNoticeDto } from './dto/res/generalNotice.dto';
import { firstValueFrom, from, groupBy, mergeMap, toArray } from 'rxjs';
import { htmlToText } from 'html-to-text';
import { FileType } from '@prisma/client';
import { ExpandedGeneralNoticeDto } from './dto/res/expandedGeneralNotice.dto';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
export class NoticeMapper {
  private readonly s3Url: string;
  constructor(private readonly customConfigService: CustomConfigService) {
    this.s3Url = `https://s3.${customConfigService.AWS_S3_REGION}.amazonaws.com/${customConfigService.AWS_S3_BUCKET_NAME}/`;
  }

  async NoticeFullContentToExpandedGeneralNoticeList(
    {
      id,
      createdAt,
      tags,
      views,
      contents,
      crawls,
      author,
      files,
      reactions,
      currentDeadline,
      reminders,
      category,
      groupId,
      publishedAt,
    }: NoticeFullContent,
    langFromDto?: string,
    userUuid?: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    const resultReaction = await firstValueFrom(
      from(reactions).pipe(
        groupBy(({ emoji }) => emoji),
        mergeMap((group) => group.pipe(toArray())),
        toArray(),
      ),
    );
    const mainContent =
      contents.filter(({ lang }) => lang === (langFromDto ?? 'ko'))[0] ??
      contents[0];
    return {
      id,
      ...(crawls.length > 0
        ? {
            title: crawls[0].title,
            langs: ['ko'],
            content: crawls[crawls.length - 1].body,
            deadline: null,
          }
        : {
            title: mainContent.title as string,
            langs: Array.from(new Set(contents.map(({ lang }) => lang))),
            content: mainContent.body,
            deadline: mainContent.deadline ?? null,
          }),
      author,
      createdAt,
      tags: tags.map(({ name }) => name),
      views,
      currentDeadline: currentDeadline ?? null,
      imageUrls: files
        ?.filter(({ type }) => type === FileType.IMAGE)
        .map(({ url }) => `${this.s3Url}${url}`),
      documentUrls: files
        ?.filter(({ type }) => type === FileType.DOCUMENT)
        .map(({ url }) => `${this.s3Url}${url}`),
      additionalContents: contents
        .filter(({ id }) => id !== 1)
        .map(({ id, createdAt, body, deadline, lang }) => ({
          id,
          content: body,
          deadline: deadline ?? null,
          createdAt,
          lang,
        })),
      isReminded: reminders.some(({ uuid }) => uuid === userUuid),
      category,
      reactions: resultReaction.map((reactions) => ({
        emoji: reactions[0].emoji,
        count: reactions.length,
        isReacted: reactions.some(({ userId }) => userId === userUuid),
      })),
      publishedAt,
      groupId,
    };
  }

  async NoticeFullContentToGeneralNoticeList(
    noticeFullContent: NoticeFullContent,
    langFromDto?: string,
    userUuid?: string,
  ): Promise<GeneralNoticeDto> {
    const {
      content,
      additionalContents: _,
      ...result
    } = await this.NoticeFullContentToExpandedGeneralNoticeList(
      noticeFullContent,
      langFromDto,
      userUuid,
    );
    return {
      content: htmlToText(content, {
        selectors: [
          { selector: 'a', options: { ignoreHref: true } },
          { selector: 'img', format: 'skip' },
        ],
      }).slice(0, 1000),
      ...result,
    };
  }
}
