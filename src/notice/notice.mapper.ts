import { Injectable } from '@nestjs/common';
import { NoticeFullContent } from './types/noticeFullContent';
import { GeneralNoticeDto } from './dto/res/generalNotice.dto';
import { firstValueFrom, from, groupBy, mergeMap, toArray } from 'rxjs';
import { htmlToText } from 'html-to-text';
import { ConfigService } from '@nestjs/config';
import { FileType } from '@prisma/client';
import { ExpandedGeneralNoticeDto } from './dto/res/expandedGeneralNotice.dto';

@Injectable()
export class NoticeMapper {
  private readonly s3Url: string;
  constructor(private readonly configService: ConfigService) {
    this.s3Url = `https://s3.${configService.get<string>(
      'AWS_S3_REGION',
    )}.amazonaws.com/${configService.get<string>('AWS_S3_BUCKET_NAME')}/`;
  }

  async NoticeFullContentToExpandedGeneralNoticeList(
    {
      id,
      createdAt,
      tags,
      views,
      contents,
      cralws,
      author,
      files,
      reactions,
      currentDeadline,
      reminders,
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
      ...(cralws.length > 0
        ? {
            title: cralws[0].title,
            langs: ['ko'],
            content: cralws[cralws.length - 1].body,
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
      reactions: resultReaction.map((reactions) => ({
        emoji: reactions[0].emoji,
        count: reactions.length,
        isReacted: reactions.some(({ userId }) => userId === userUuid),
      })),
    };
  }

  async NoticeFullContentToGeneralNoticeList(
    {
      id,
      author,
      createdAt,
      tags,
      views,
      contents,
      cralws,
      files,
      reactions,
      currentDeadline,
      reminders,
    }: NoticeFullContent,
    langFromDto?: string,
    userUuid?: string,
  ): Promise<GeneralNoticeDto> {
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
      ...(cralws.length > 0
        ? {
            title: cralws[0].title,
            langs: ['ko'],
            deadline: null,
            content: htmlToText(cralws[cralws.length - 1].body, {
              selectors: [{ selector: 'a', options: { ignoreHref: true } }],
            }).slice(0, 1000),
          }
        : {
            title: mainContent.title as string,
            deadline: mainContent.deadline ?? null,
            langs: Array.from(new Set(contents.map(({ lang }) => lang))),
            content: htmlToText(mainContent.body, {
              selectors: [{ selector: 'a', options: { ignoreHref: true } }],
            }).slice(0, 1000),
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
      isReminded: reminders.some(({ uuid }) => uuid === userUuid),
      reactions: resultReaction.map((reactions) => ({
        emoji: reactions[0].emoji,
        count: reactions.length,
        isReacted: reactions.some(({ userId }) => userId === userUuid),
      })),
    };
  }
}
