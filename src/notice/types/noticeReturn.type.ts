import { NoticeFullcontent } from './noticeFullcontent';

export type NoticeReturn = {
  total: number;
  list: SingleNotice[];
};

type SingleNotice = Omit<
  NoticeFullcontent,
  'files' | 'author' | 'reminders'
> & {
  author: string;
  imagesUrl: string[];
  documentsUrl: string[];
};
