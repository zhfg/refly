import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateUserSettingsRequest } from '@refly/openapi-schema';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async updateSettings(uid: number, data: UpdateUserSettingsRequest) {
    return this.prisma.user.update({
      where: { id: uid },
      data: { ...data },
    });
  }
}
