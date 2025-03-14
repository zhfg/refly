import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { ShareModule } from '@/share/share.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule, ShareModule],
  providers: [TemplateService],
  controllers: [TemplateController],
  exports: [TemplateService],
})
export class TemplateModule {}
