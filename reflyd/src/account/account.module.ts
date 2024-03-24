import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
