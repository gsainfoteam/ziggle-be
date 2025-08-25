export enum Permission {
  WRITE = 'WRITE',
  DELETE = 'DELETE',
}

export type GroupsUserInfo = {
  Role: {
    RoleExternalPermission: {
      clientUuid: string;
      permission: Permission;
      roleId: number;
      roleGroupUuid: string;
    }[];
  }[];
  uuid: string;
  name: string;
}[];
