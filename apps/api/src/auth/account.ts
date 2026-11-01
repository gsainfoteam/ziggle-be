import { defineAccount } from '@gsainfoteam/account-nest';

export const account = defineAccount({
  requiredScopes: ['name'],
  session: {},
});
export const { AccountModule, AccountService } = account;
export type AccountService = InstanceType<typeof AccountService>;
