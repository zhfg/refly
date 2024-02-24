import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [AccountService, PrismaService],
  exports: [AccountService],
})
export class AccountModule {}
