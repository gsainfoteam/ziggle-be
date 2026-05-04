import { Content, Crawl, Reaction } from '@generated/prisma/client';
import { htmlToText } from 'html-to-text';
import { FileService } from '@lib/file/file.service';
import {
  GeneralNoticeDto,
  GeneralNoticeListDto,
} from './dto/res/generalNotice.dto';
import {
  AdditionalContentsDto,
  ExpandedGeneralNoticeDto,
} from './dto/res/expandedGeneralNotice.dto';
import { CreateNoticeResDto } from './dto/res/createNoticeRes.dto';
import { NoticeFullContent } from './types/noticeFullContent';

const pickMainContent = (contents: Content[], lang?: string): Content =>
  contents.find((content) => content.lang === (lang ?? 'ko')) ?? contents[0];

const buildRawContent = (crawls: Crawl[], mainContent: Content): string =>
  crawls.length > 0 ? crawls[0].body : mainContent.body;

const buildPreviewContent = (crawls: Crawl[], mainContent: Content): string => {
  const content = buildRawContent(crawls, mainContent);
  return htmlToText(content, {
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  }).slice(0, 1000);
};

const summarizeReactions = (
  reactions: Reaction[],
  userUuid?: string,
): GeneralNoticeDto['reactions'] => {
  const reactionMap = new Map<string, { count: number; isReacted: boolean }>();
  for (const reaction of reactions) {
    const current = reactionMap.get(reaction.emoji) ?? {
      count: 0,
      isReacted: false,
    };
    current.count += 1;

    if (reaction.userId === userUuid) {
      current.isReacted = true;
    }

    reactionMap.set(reaction.emoji, current);
  }
  return Array.from(reactionMap.entries()).map(([emoji, result]) => ({
    emoji,
    count: result.count,
    isReacted: result.isReacted,
  }));
};

const extractLangs = (crawls: Crawl[], contents: Content[]): string[] => {
  if (crawls.length > 0) {
    return ['ko'];
  }
  return Array.from(new Set(contents.map(({ lang }) => lang)));
};

const buildAdditionalContents = (
  contents: Content[],
): AdditionalContentsDto[] =>
  contents
    .filter(({ id }) => id !== 1)
    .map(({ id, lang, deadline, body, createdAt }) => ({
      id,
      lang,
      deadline: deadline ?? null,
      content: body,
      createdAt,
    }));

export const toGeneralNoticeDto = (
  notice: NoticeFullContent,
  fileService: FileService,
  lang?: string,
  userUuid?: string,
): GeneralNoticeDto => {
  const mainContent = pickMainContent(notice.contents, lang);
  return new GeneralNoticeDto({
    id: notice.id,
    title:
      notice.crawls.length > 0
        ? (notice.crawls[0].title ?? '')
        : (mainContent.title ?? ''),
    group: notice.group,
    author: notice.author,
    createdAt: notice.createdAt,
    tags: notice.tags.map(({ name }) => name),
    views: notice.views,
    langs: extractLangs(notice.crawls, notice.contents),
    content: buildPreviewContent(notice.crawls, mainContent),
    reactions: summarizeReactions(notice.reactions, userUuid),
    isReminded: notice.reminders.some(({ uuid }) => uuid === userUuid),
    category: notice.category,
    deadline: notice.crawls.length > 0 ? null : (mainContent.deadline ?? null),
    currentDeadline: notice.currentDeadline,
    publishedAt: notice.publishedAt,
    ...fileService.getFilesUrl(notice.files),
    crawledUrl: notice.crawls.length > 0 ? notice.crawls[0].url : null,
    isViewed: notice.UserRecord[0]?.isViewed ?? false,
    isBookmarked: notice.UserRecord[0]?.isBookmarked ?? false,
  });
};

export const toGeneralNoticeListDto = (
  notices: NoticeFullContent[],
  total: number,
  fileService: FileService,
  lang?: string,
  userUuid?: string,
): GeneralNoticeListDto =>
  new GeneralNoticeListDto({
    total,
    list: notices.map((notice) =>
      toGeneralNoticeDto(notice, fileService, lang, userUuid),
    ),
  });

export const toExpandedNoticeDto = (
  notice: NoticeFullContent,
  fileService: FileService,
  lang?: string,
  userUuid?: string,
): ExpandedGeneralNoticeDto => {
  const mainContent = pickMainContent(notice.contents, lang);
  const generalNotice = toGeneralNoticeDto(notice, fileService, lang, userUuid);
  return new ExpandedGeneralNoticeDto({
    ...generalNotice,
    content: buildRawContent(notice.crawls, mainContent),
    additionalContents: buildAdditionalContents(notice.contents),
  });
};

export const toCreateNoticeResDto = (
  notice: NoticeFullContent,
  fileService: FileService,
): CreateNoticeResDto => {
  const expandedNotice = toExpandedNoticeDto(notice, fileService);
  return new CreateNoticeResDto({
    ...expandedNotice,
    tags: notice.tags.map(({ id }) => id),
  });
};
