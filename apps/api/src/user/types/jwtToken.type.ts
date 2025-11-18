export type JwtTokenType = {
  access_token: string;
  refresh_token: string;
  consent_required: boolean;
};

export type IssueTokenType = {
  access_token: string;
  refresh_token: string;
};
