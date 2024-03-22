import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('digest')
export class DigestController {
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listDigest() {
    return {};
  }

  @UseGuards(JwtAuthGuard)
  @Get(':digestId')
  async showDigestDetail() {
    return {};
  }
}
