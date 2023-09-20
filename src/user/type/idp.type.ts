export type idpJwtResponse = {
  access_token: string;
  refresh_token: string;
};

export type idpUserInfoResponse = {
  user_uuid: string;
  user_email_id: string;
  user_name: string;
  user_phone_number: string;
  student_number: string;
};
