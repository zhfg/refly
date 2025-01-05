import { UserSettings } from '@refly-packages/openapi-schema';
import { User as UserModel } from '@prisma/client';
import { pick } from '@refly-packages/utils';

export const userPO2Settings = (user: UserModel): UserSettings => {
  return pick(user, [
    'uid',
    'avatar',
    'name',
    'nickname',
    'email',
    'uiLocale',
    'outputLocale',
    'customerId',
    'hasBetaAccess',
  ]);
};
