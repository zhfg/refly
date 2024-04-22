import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';
import { UpdateSettingsDTO } from './user.dto';

@Injectable()
export class UserService {
  constructor(private logger: LoggerService, private prisma: PrismaService) {
    this.logger.setContext(UserService.name);
  }

  async findUnique(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<User | undefined> {
    return this.prisma.user.findUnique({ where });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async updateSettings(uid: number, data: UpdateSettingsDTO) {
    return this.prisma.user.update({
      where: { id: uid },
      data: { locale: data.locale },
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
