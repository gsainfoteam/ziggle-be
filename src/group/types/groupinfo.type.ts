export enum Authority {
  WRITE = 'WRITE',
  DELETE = 'DELETE',
}

export type GroupRoleInfo = {
  id: number;
  name: string;
  groupUuid: string;
  authorities: string[];
  externalAuthority: Authority[];
};

export type GroupInfo = {
  uuid: string;
  name: string;
  description: string;
  createdAt: string;
  presidentUuid: string;
  verifiedAt: string;
  notionPageId: string | null;
  profileImage: string | null;
  role: GroupRoleInfo[];
};
