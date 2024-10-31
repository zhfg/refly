import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ShareService } from '@/share/share.service';
import { CreateShareRequest, DeleteShareRequest } from '@refly-packages/openapi-schema';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';
import { buildSuccessResponse } from '@/utils';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @UseGuards(JwtAuthGuard)
  @Post('new')
  async createShare(@User() user: UserModel, @Body() body: CreateShareRequest) {
    const result = await this.shareService.createShare(user, body);
    return buildSuccessResponse(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete')
  async deleteShare(@User() user: UserModel, @Body() body: DeleteShareRequest) {
    await this.shareService.deleteShare(user, body);
    return buildSuccessResponse(null);
  }

  @Get('content')
  async getShareContent(
    @Query('shareCode') shareCode: string,
    @Query('canvasId') canvasId?: string,
  ) {
    const result = await this.shareService.getShareDetail({ shareCode, canvasId });
    return buildSuccessResponse(result);
  }
}
