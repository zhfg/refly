import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import {
  CheckSettingsFieldData,
  UpdateUserSettingsRequest,
  User,
} from '@refly-packages/openapi-schema';
import { Subscription } from '@prisma/client';
import { pick } from '@refly-packages/utils';
import { SubscriptionService } from '@/subscription/subscription.service';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async getUserSettings(user: User) {
    const userPo = await this.prisma.user.findUnique({
      where: { uid: user.uid },
    });

    let subscription: Subscription | null = null;
    if (userPo.subscriptionId) {
      subscription = await this.subscriptionService.getSubscription(userPo.subscriptionId);
    }

    return {
      ...userPo,
      subscription,
    };
  }

  async updateSettings(user: User, data: UpdateUserSettingsRequest) {
    return this.prisma.user.update({
      where: { uid: user.uid },
      data: {
        ...pick(data, ['name', 'nickname', 'uiLocale', 'outputLocale']),
        preferences: JSON.stringify(data.preferences),
        onboarding: JSON.stringify(data.onboarding),
      },
    });
  }

  async checkSettingsField(user: User, param: CheckSettingsFieldData['query']) {
    const { field, value } = param;
    const otherUser = await this.prisma.user.findFirst({
      where: { [field]: value, uid: { not: user.uid } },
    });
    return {
      field,
      value,
      available: !otherUser,
    };
  }
}
