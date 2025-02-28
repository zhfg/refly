import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ShareService } from '@/share/share.service';
import {
  User,
  CreateShareRequest,
  DeleteShareRequest,
  CreateShareResponse,
} from '@refly-packages/openapi-schema';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { LoginedUser } from '@/utils/decorators/user.decorator';
import { buildSuccessResponse } from '@/utils';

@Controller('v1/share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @UseGuards(JwtAuthGuard)
  @Post('new')
  async createShare(
    @LoginedUser() user: User,
    @Body() body: CreateShareRequest,
  ): Promise<CreateShareResponse> {
    const result = await this.shareService.createShare(user, body);
    return buildSuccessResponse({ shareId: result.shareId });
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete')
  async deleteShare(@LoginedUser() user: User, @Body() body: DeleteShareRequest) {
    await this.shareService.deleteShare(user, body);
    return buildSuccessResponse(null);
  }
}
