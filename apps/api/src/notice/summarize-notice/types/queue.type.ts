export type SummarizeNoticeQueueData = {
  noticeId: number;
  content: string;
  contentVersion: Date; // updatedAt timestamp for deduplication
};
