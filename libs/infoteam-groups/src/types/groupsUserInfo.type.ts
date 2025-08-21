export type GroupsUserInfo = [
  {
    RoleExternalPermission: [
      {
        ExternalPermission: {
          clientUuid: string;
          permission: string;
        };
        clientUuid: string;
        permission: string;
        roleId: number;
        roleGroupUuid: string;
      },
    ];
    name: string;
    id: number;
    groupUuid: string;
    permissions: [];
  },
];
