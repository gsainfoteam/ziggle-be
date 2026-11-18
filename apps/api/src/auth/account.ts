import { defineAccount } from '@infoteam/account-nest';

export const { AccountModule, AccountService } = defineAccount({
  requiredScopes: ['name', 'email'],
});
export type AccountService = InstanceType<typeof AccountService>;
