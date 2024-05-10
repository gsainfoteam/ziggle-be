export type IdpJwtResponse = {
  access_token: string;
  refresh_token: string;
};

export type IdpUserInfoRes = {
  uuid: string;
  email: string;
  name: string;
  studentId: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: string;
};
