import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notice } from 'src/global/entity/notice.entity';
import {
  And,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { User } from 'src/global/entity/user.entity';
import { Tag } from 'src/global/entity/tag.entity';
import dayjs from 'dayjs';

@Injectable()
export class NoticeRepository {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async getNoticeList(
    {
      offset: skip = 0,
      limit: take = 10,
      orderBy = 'recent',
      search = '',
      tags = [],
      my,
    }: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<{ list: Notice[]; total: number }> {
    const orderByDeadline = orderBy === 'deadline';
    const orderByRecent = orderBy === 'recent';
    const orderByHot = orderBy === 'hot';

    const tagsQuery = this.noticeRepository
      .createQueryBuilder()
      .subQuery()
      .select([
        'notice.id AS id',
        'notice.deadline AS deadline',
        'notice.createdAt AS createdAt',
        'notice.views AS views',
      ])
      .from(Notice, 'notice')
      .leftJoin('notice.tags', 'tag')
      .where(tags.length > 0 ? 'tag.name IN (:...tags)' : 'TRUE')
      .distinct()
      .getQuery();

    const query = this.noticeRepository
      .createQueryBuilder('notice')
      .innerJoin(tagsQuery, 'tagNotice', 'notice.id = tagNotice.id', { tags })
      .leftJoin('notice.reminders', 'reminders')
      .andWhere(
        {
          ...(orderByDeadline && {
            deadline: MoreThanOrEqual(dayjs().startOf('d').toDate()),
          }),
          ...(orderByHot && {
            views: MoreThanOrEqual(150),
            createdAt: MoreThanOrEqual(
              dayjs().startOf('d').subtract(7, 'd').toDate(),
            ),
          }),
        },
        { userUuid },
      )
      .andWhere(
        search
          ? [{ title: Like(`%${search}%`) }, { body: Like(`%${search}%`) }]
          : [],
        { search },
      )
      .andWhere(
        my === 'reminders'
          ? 'reminders.uuid = :userUuid'
          : my === 'own'
          ? 'notice.author = :userUuid'
          : 'TRUE',
        { userUuid },
      )
      .leftJoinAndSelect('notice.author', 'author')
      .leftJoinAndSelect('notice.tags', 'tags')
      .orderBy({
        ...(orderByDeadline && { 'notice.deadline': 'ASC' }),
        ...(orderByHot && { 'notice.views': 'DESC' }),
        ...((orderByRecent || orderByHot) && { 'notice.createdAt': 'DESC' }),
      })
      .take(take)
      .skip(skip);
    return {
      list: await query.printSql().getMany(),
      total: await query.getCount(),
    };
  }

  private async getNotice(id: number, userUUID?: string): Promise<Notice> {
    return this.noticeRepository.findOne({
      where: { id, author: { uuid: userUUID } },
      relations: { reminders: true },
    });
  }

  async getNoticeAndUpdateViews(id: number): Promise<Notice> {
    const notice = await this.getNotice(id);
    if (!notice) return null;
    notice.views += 1;
    return this.noticeRepository.save(notice);
  }

  async createNotice(
    user: User,
    title: string,
    body: string,
    deadline?: Date,
    tags?: Tag[],
    images?: string[],
  ): Promise<Notice> {
    const notice = this.noticeRepository.create({
      title,
      body,
      deadline: deadline ? deadline : null,
      author: user,
      imagesUrl: images,
      tags,
    });
    return this.noticeRepository.save(notice);
  }

  async updateNotice(
    userUUID: string,
    id: number,
    title?: string,
    body?: string,
    deadline?: Date,
  ): Promise<Notice> {
    const notice = await this.getNotice(id);
    if (!notice) return null;
    if (notice.author.uuid !== userUUID) return null;
    notice.title = title ? title : notice.title;
    notice.body = body ? body : notice.body;
    notice.deadline = deadline ? deadline : notice.deadline;
    return this.noticeRepository.save(notice);
  }

  async updateNoticeTags(
    userUUID: string,
    id: number,
    tags: Tag[],
  ): Promise<Notice> {
    const notice = await this.getNotice(id);
    if (!notice) return null;
    if (notice.author.uuid !== userUUID) return null;

    notice.tags = notice.tags.concat(tags);
    return this.noticeRepository.save(notice);
  }

  async addNoticeReminder(id: number, reminder: User): Promise<Notice> {
    const notice = await this.getNotice(id);
    if (!notice) throw new NotFoundException(`Notice with ID "${id}"`);
    if (notice.reminders.some((r) => r.uuid === reminder.uuid))
      throw new ConflictException('already added');
    notice.reminders.push(reminder);
    return this.noticeRepository.save(notice);
  }

  async removeNoticeReminder(id: number, reminder: User): Promise<Notice> {
    const notice = await this.getNotice(id);
    if (!notice) throw new NotFoundException(`Notice with ID "${id}"`);
    if (notice.reminders.every((r) => r.uuid !== reminder.uuid))
      throw new ConflictException('already removed');

    notice.reminders = notice.reminders.filter((r) => r.uuid !== reminder.uuid);
    return this.noticeRepository.save(notice);
  }

  async updateNoticeImages(
    userUUID: string,
    id: number,
    images: string[],
  ): Promise<Notice> {
    const notice = await this.getNotice(id);
    if (!notice) return null;
    if (notice.author.uuid !== userUUID) return null;

    notice.imagesUrl = notice.imagesUrl.concat(images);
    return this.noticeRepository.save(notice);
  }

  async deleteNotice(userUUID: string, id: number): Promise<Notice> {
    const notice = await this.getNotice(id, userUUID);
    if (!notice) return null;
    const result = await this.noticeRepository.softDelete({ id });
    if (result.affected === 0) return null;
    return notice;
  }

  async getReminderTargetList(): Promise<Notice[]> {
    const notices = await this.noticeRepository.find({
      where: {
        deadline: And(
          LessThanOrEqual(dayjs().startOf('d').add(3, 'd').toDate()),
          MoreThanOrEqual(dayjs().startOf('d').toDate()),
        ),
      },
      relations: { reminders: { fcmTokens: true } },
    });
    return notices.filter((notice) => notice.reminders.length > 0);
  }
}
