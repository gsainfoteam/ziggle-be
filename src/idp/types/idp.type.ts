export type IdpJwtResponse = {
  access_token: string;
  refresh_token: string;
};

export type IdpUserInfoRes = {
  uuid: string;
  email: string;
  name: string;
  student_id: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  access_level: string;
};
