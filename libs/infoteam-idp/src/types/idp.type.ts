// deprecated
export type IdpJwtResponse = {
  access_token: string;
  refresh_token: string;
};

export type IdpUserInfoResponse = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
  student_id?: string;
  phone_number?: string;
};
