export type GroupsUserInfo = {
  RoleExternalPermission: {
    clientUuid: string;
    permission: string;
    roleId: number;
    roleGroupUuid: string;
  }[];
  name: string;
  id: number;
  groupUuid: string;
}[];
