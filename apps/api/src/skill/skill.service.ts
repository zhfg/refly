import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class SkillService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}
}
