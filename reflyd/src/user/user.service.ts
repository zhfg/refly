import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUnique(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<User | undefined> {
    return this.prisma.user.findUnique({ where });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async upsert(args: {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.UserCreateInput;
    update: Prisma.UserUpdateInput;
  }) {
    return this.prisma.user.upsert(args);
  }
}
