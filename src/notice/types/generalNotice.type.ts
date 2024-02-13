export type GeneralNotice = {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  tags: string[];
  views: number;
  langs: string[];
  content: string;
  reactions: GeneralReaction[];
  isReminded: boolean;
  deadline: string;
  currentDeadline: string;
  imageUrls?: string[];
  documentUrls?: string[];
};

export type ExpandedGeneralNotice = GeneralNotice & {
  additionalContents: SmallNotice[];
};

export type SmallNotice = {
  id: number;
  deadline: string;
  content: string;
  createdAt: string;
  lang: string;
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
