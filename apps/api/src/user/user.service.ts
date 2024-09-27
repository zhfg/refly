import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import {
  CheckSettingsFieldData,
  UpdateUserSettingsRequest,
  User,
} from '@refly-packages/openapi-schema';
import { pick } from '@refly-packages/utils';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async updateSettings(user: User, data: UpdateUserSettingsRequest) {
    return this.prisma.user.update({
      where: { uid: user.uid },
      data: pick(data, ['name', 'nickname', 'uiLocale', 'outputLocale']),
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
