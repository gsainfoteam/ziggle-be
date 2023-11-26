import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import cheerio from 'cheerio';
import dayjs from 'dayjs';
import { htmlToText } from 'html-to-text';
import {
  catchError,
  concat,
  concatMap,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  ObservedValueOf,
  of,
  range,
  takeWhile,
  throwError,
  timeout,
  toArray,
} from 'rxjs';
import { FcmService } from 'src/global/service/fcm.service';
import { ImageService } from 'src/image/image.service';
import { TagService } from 'src/tag/tag.service';
import { UserService } from 'src/user/user.service';
import { AdditionalNoticeDto } from './dto/additionalNotice.dto';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { ForeignContentDto } from './dto/foreignContent.dto';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { NoticeRepository } from './notice.repository';

@Injectable()
export class NoticeService {
  private readonly s3Url: string;
  constructor(
    private readonly noticeRepository: NoticeRepository,
    private readonly imageService: ImageService,
    private readonly fcmService: FcmService,
    private readonly httpService: HttpService,
    private readonly tagService: TagService,
    private readonly userService: UserService,
    configService: ConfigService,
  ) {
    this.s3Url = `https://s3.${configService.get<string>(
      'AWS_S3_REGION',
    )}.amazonaws.com/${configService.get<string>('AWS_S3_BUCKET_NAME')}/`;
  }

  async getNoticeList(
    getAllNoticeQueryDto: GetAllNoticeQueryDto,
    userUuid?: string,
  ) {
    const notices = await this.noticeRepository.getNoticeList(
      getAllNoticeQueryDto,
      userUuid,
    );
    return {
      total: await this.noticeRepository.getTotalCount(
        getAllNoticeQueryDto,
        userUuid,
      ),
      list: notices.map(({ files, author, ...notice }) => {
        delete notice.authorId;
        return {
          ...notice,
          contents: notice.contents.map((content) => ({
            ...content,
            body: htmlToText(content.body).slice(0, 100),
          })),
          author: author.name,
          imageUrl: files?.[0]?.url ? `${this.s3Url}${files[0].url}` : null,
          title: notice.contents[0].title,
          body: htmlToText(notice.contents[0].body).slice(0, 100),
        };
      }),
    };
  }

  async getNotice(id: number, userUuid?: string) {
    const notice = await this.noticeRepository.getNotice(id);
    const { reminders, ...noticeInfo } = notice;
    return {
      ...noticeInfo,
      author: notice.author.name,
      imagesUrl: notice.files?.map((file) => `${this.s3Url}${file.url}`),
      reminder: reminders.some((reminder) => reminder.uuid === userUuid),
      title: notice.contents[0].title,
      body: htmlToText(notice.contents[0].body),
    };
  }

  async createNotice(
    { title, body, deadline, tags, images }: CreateNoticeDto,
    userUuid: string,
  ) {
    if (images.length) {
      await this.imageService.validateImages(images);
    }

    const notice = await this.noticeRepository.createNotice(
      {
        title,
        body,
        deadline,
        tags,
        images,
      },
      userUuid,
    );

    this.sendNoticeToAllUsers(
      title,
      images?.map((image) => `${this.s3Url}${image}`),
      notice,
    );
    return this.getNotice(notice.id);
  }

  async addNoticeAdditional(
    { title, body, deadline, to }: AdditionalNoticeDto,
    id: number,
    userUuid: string,
  ) {
    await this.noticeRepository.addAdditionalNotice(
      {
        title,
        body,
        deadline,
      },
      id,
      userUuid,
    );
    if (to) {
      this.fcmService.postMessage(
        {
          title: '공지글이 추가되었습니다.',
          body: title,
        },
        to === 'all'
          ? (await this.noticeRepository.getAllFcmTokens()).map(
              ({ token }) => token,
            )
          : (await this.noticeRepository.getFcmTokensByNoticeId(id)).map(
              ({ token }) => token,
            ),
        { path: `/root/article?id=${id}` },
      );
    }

    return this.getNotice(id);
  }

  async addForeignContent(
    { lang, title, body, deadline }: ForeignContentDto,
    id: number,
    idx: number,
    userUuid: string,
  ) {
    await this.noticeRepository.addForeignContent(
      { lang, title, body, deadline },
      id,
      idx,
      userUuid,
    );
    return this.getNotice(id);
  }

  async addNoticeReminder(id: number, userUuid: string) {
    await this.noticeRepository.addReminder(id, userUuid);

    return this.getNotice(id, userUuid);
  }

  async removeNoticeReminder(id: number, userUuid: string) {
    await this.noticeRepository.removeReminder(id, userUuid);

    return this.getNotice(id, userUuid);
  }

  async deleteNotice(id: number, userUuid: string): Promise<void> {
    const notice = await this.noticeRepository.getNotice(id);
    this.imageService.deleteImages(notice.files.map(({ url }) => url));
    await this.noticeRepository.deleteNotice(id, userUuid);
  }

  @Cron('0 9 * * *')
  async sendReminderMessage() {
    const targetNotices = await this.noticeRepository.getNoticeByTime(
      new Date(),
    );
    targetNotices.map((notice) => {
      const leftDate = dayjs(notice.currentDeadline)
        .startOf('d')
        .diff(dayjs().startOf('d'), 'd');
      return this.fcmService.postMessage(
        {
          title: `[Reminder] ${leftDate}일 남은 공지가 있어요!`,
          body: `${notice.contents[0].title} 마감이 ${leftDate}일 남았어요`,
          imageUrl: notice.files?.[0].url
            ? `${this.s3Url}${notice.files[0].url}`
            : undefined,
        },
        notice.reminders
          .flatMap(({ fcmTokens }) => fcmTokens)
          .map(({ token }) => token),
        { path: `/root/article?id=${notice.id}` },
      );
    });
  }

  private getAcademicNoticeList() {
    const baseUrl = 'https://www.gist.ac.kr/kr/html/sub05/050209.html';
    return range(1, 36).pipe(
      concatMap((page) => this.httpService.get(`${baseUrl}?GotoPage=${page}`)),
      timeout(10000),
      map((res) => cheerio.load(res.data)),
      catchError(throwError),
      map(($) =>
        $('table > tbody > tr').filter(
          (_, e) => e.type === 'tag' && !e.attribs.class.includes('lstNtc'),
        ),
      ),
      concatMap(($) => $.toArray()),
      map(cheerio),
      map(($) => ({
        id: Number.parseInt($.find('td').first().text().trim()),
        title: $.find('td').eq(2).text().trim(),
        link: `${baseUrl}${$.find('td').eq(2).find('a').attr('href')}`,
        author: $.find('td').eq(3).text().trim(),
        category: $.find('td').eq(1).text().trim(),
        createdAt: $.find('td').eq(5).text().trim(),
      })),
    );
  }

  private getAcademicNotice({
    link,
  }: ObservedValueOf<ReturnType<typeof this.getAcademicNoticeList>>) {
    const baseUrl = 'https://www.gist.ac.kr/kr/html/sub05/050209.html';
    return this.httpService.get(link).pipe(
      timeout(10000),
      map((res) => res.data),
      map((e) => cheerio.load(e)),
      catchError(throwError),
      map(($) => {
        const files = $('.bd_detail_file > ul > li > a')
          .toArray()
          .map((e) => ({
            href: `${baseUrl}${$(e).attr('href')}`,
            name: $(e).text().trim(),
            type: $(e).attr('class') as
              | 'doc'
              | 'hwp'
              | 'pdf'
              | 'imgs'
              | 'xls'
              | 'etc',
          }));
        const content = $('.bd_detail_content').html().trim();
        return { files, content };
      }),
    );
  }

  @Cron('*/5 * * * *')
  async crawlAcademicNotice() {
    const recentNotice = await this.noticeRepository.getNoticeList({
      limit: 1,
      orderBy: 'recent',
      tags: ['academic'],
    });
    const $ = this.getAcademicNoticeList().pipe(
      takeWhile((n) => n.title !== recentNotice[0]?.contents[0].title),
      timeout(60e3),
      concatMap((meta) =>
        this.getAcademicNotice(meta).pipe(map((notice) => ({ notice, meta }))),
      ),
      concatMap(async ({ notice, meta }) => {
        const original = `<p>학사공지 원본 링크 : <a href="${meta.link}" target="_blank">${meta.link}</a></p>`;
        const filesList = notice.files
          .map((file) => `<li><a href="${file.href}">${file.name}</a></li>`)
          .join('');
        const filesBody = notice.files.length ? `<ul>${filesList}</ul>` : '';
        const body = `${original}${filesBody}${notice.content}`;
        const tags = await this.tagService.findOrCreateTags([
          'academic',
          meta.category,
        ]);
        const user = await this.userService.addTempUser(
          `${meta.author} (${meta.category})`,
        );
        const imagesStream = from(
          cheerio.load(notice.content)('img').toArray(),
        ).pipe(
          map((e) => e.type === 'tag' && e.attribs.src),
          concatMap((v) =>
            this.httpService.get(v, { responseType: 'arraybuffer' }),
          ),
          map((res) => res.data as ArrayBuffer),
          map(
            (buffer, index) =>
              ({
                buffer,
                originalname: `${meta.id}-${meta.title}-${index}.png`,
              } as Express.Multer.File),
          ),
          toArray(),
        );
        const images = await this.imageService.uploadImages(
          await firstValueFrom(imagesStream),
        );
        const result = await this.noticeRepository.createNotice(
          {
            title: meta.title,
            body,
            images,
            tags: tags.map(({ id }) => id),
          },
          user.uuid,
          dayjs(meta.createdAt).tz('Asia/Seoul').toDate(),
        );
        await this.sendNoticeToAllUsers(meta.title, [], result);
      }),
    );
    await lastValueFrom(concat($, of(null)));
  }

  private async sendNoticeToAllUsers(
    title: string,
    images: string[],
    notice: Awaited<ReturnType<NoticeRepository['createNotice']>>,
  ) {
    await this.fcmService.postMessage(
      {
        title: '새 공지글',
        body: title,
        imageUrl: images?.length ? images[0] : undefined,
      },
      (await this.noticeRepository.getAllFcmTokens()).map(({ token }) => token),
      { path: `/root/article?id=${notice.id}` },
    );
  }
}
