import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvokeActionRequest, InvokeActionResponse } from '@refly-packages/openapi-schema';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';
import { buildSuccessResponse } from '@/utils/response';

@Controller('action')
export class ActionController {
  constructor() {}

  @UseGuards(JwtAuthGuard)
  @Post('/invoke')
  async invokeSkill(
    @User() user: UserModel,
    @Body() body: InvokeActionRequest,
  ): Promise<InvokeActionResponse> {
    return buildSuccessResponse({ user, body });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/streamInvoke')
  async streamInvokeSkill(
    @User() user: UserModel,
    @Body() body: InvokeActionRequest,
    @Res() res: Response,
  ) {
    return buildSuccessResponse({ user, body });
  }
}
