export type GeneralNotice = {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  tags: string[];
  views: number;
  lang: string;
  content: string;
  additionalContent: string[];
  deadline?: string;
  imageUrls?: string[];
  documentUrls?: string[];
};

export type GeneralNoticeList = {
  total: number;
  list: GeneralNotice[];
};
