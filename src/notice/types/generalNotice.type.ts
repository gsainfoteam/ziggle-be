export type GeneralNotice = {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  tags: string[];
  views: number;
  lang: string;
  content: string;
  reactions: GeneralReaction[];
  isReminded: boolean;
  deadline?: string;
  imageUrls?: string[];
  documentUrls?: string[];
};

export type ExpandedGeneralNotice = GeneralNotice & {
  additionalContent: SmallNotice[];
};

export type SmallNotice = {
  deadline: string;
  content: string;
};

export type GeneralNoticeList = {
  total: number;
  list: GeneralNotice[];
};

export type GeneralReaction = {
  emoji: string;
  count: number;
  isReacted: boolean;
};
