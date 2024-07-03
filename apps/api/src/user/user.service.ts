import { Injectable, Logger } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { UpdateUserSettingsRequest } from '@refly/openapi-schema';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async findUnique(where: Prisma.UserWhereUniqueInput): Promise<User | undefined> {
    return this.prisma.user.findUnique({ where });
  }

  async findUserByUID(uid: string): Promise<User> {
    return this.prisma.user.findFirst({ where: { uid } });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async updateSettings(uid: number, data: UpdateUserSettingsRequest) {
    return this.prisma.user.update({
      where: { id: uid },
      data: { ...data },
    });
  }

  async upsert(args: {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.UserCreateInput;
    update: Prisma.UserUpdateInput;
  }) {
    return this.prisma.user.upsert(args);
  }

  async getUserPreferences(params: { userId: number }) {
    return this.prisma.userPreference.findMany({
      where: { ...params },
      orderBy: { score: 'desc' },
      include: { topic: true },
    });
  }

  async countUserPreferences(params: { userId: number }) {
    return this.prisma.userPreference.count({
      where: { ...params },
    });
  }
}
