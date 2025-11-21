// deprecated
export type IdpJwtResponse = {
  access_token: string;
  refresh_token: string;
};

export type IdpUserInfoResponse = {
  sub: string;
  email: string;
  name: string;
  student_id?: string;
  phone_number?: string;
};
