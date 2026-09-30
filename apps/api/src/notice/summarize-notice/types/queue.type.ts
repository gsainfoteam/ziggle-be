export type SummarizeNoticeQueueData = {
  noticeId: number;
  content: string;
  contentVersion: Date; // lastEditedAt timestamp for deduplication
};
