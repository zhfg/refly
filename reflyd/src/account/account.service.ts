import { Injectable, Logger } from '@nestjs/common';
import { Account, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AccountService {
  private logger = new Logger(AccountService.name);

  constructor(private prisma: PrismaService) {}

  async findUnique(where: Prisma.AccountWhereUniqueInput): Promise<Account | undefined> {
    return this.prisma.account.findUnique({ where });
  }

  async create(data: Prisma.AccountCreateInput) {
    return this.prisma.account.create({ data });
  }

  async upsert(args: {
    where: Prisma.AccountWhereUniqueInput;
    create: Prisma.AccountCreateInput;
    update: Prisma.AccountUpdateInput;
  }): Promise<Account> {
    return this.prisma.account.upsert(args);
  }
}
