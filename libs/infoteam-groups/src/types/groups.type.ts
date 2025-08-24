export enum Permission {
  WRITE = 'WRITE',
  DELETE = 'DELETE',
}

export type GroupsUserInfo = {
  RoleExternalPermission: {
    clientUuid: string;
    permission: Permission;
    roleId: number;
    roleGroupUuid: string;
  }[];
  name: string;
  id: number;
  groupUuid: string;
}[];
