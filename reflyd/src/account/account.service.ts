import { Injectable } from '@nestjs/common';
import { Account, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class AccountService {
  constructor(private logger: LoggerService, private prisma: PrismaService) {
    this.logger.setContext(AccountService.name);
  }

  async findUnique(
    where: Prisma.AccountWhereUniqueInput,
  ): Promise<Account | undefined> {
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
