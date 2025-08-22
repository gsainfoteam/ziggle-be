import { GroupsUserInfo } from 'libs/infoteam-groups/src/types/groups.type';

export enum Authority {
  WRITE = 'WRITE',
  DELETE = 'DELETE',
}

export type GroupInfo = {
  uuid: string;
  name: string;
  description: string;
  createdAt: string;
  presidentUuid: string;
  verifiedAt: string;
  notionPageId: string | null;
  profileImage: string | null;
  role: GroupsUserInfo[];
};
