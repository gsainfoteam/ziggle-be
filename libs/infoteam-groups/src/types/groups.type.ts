export type GroupsUserInfoResponse = {
  RoleExternalPermission: {
    ExternalPermission: {
      clientUuid: string;
      permission: string;
    };
    clientUuid: string;
    permission: string;
    roleId: number;
    roleGroupUuid: string;
  }[];
  name: string;
  id: number;
  groupUuid: string;
  permissions: string[];
}[];

export type GroupsUserInfo = {
  groups: {
    RoleExternalPermission: {
      ExternalPermission: {
        clientUuid: string;
        permission: string;
      };
      clientUuid: string;
      permission: string;
      roleId: number;
      roleGroupUuid: string;
    }[];
    name: string;
    id: number;
    groupUuid: string;
    permissions: string[];
  }[];
};
