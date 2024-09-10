import { Controller, UseGuards, Post, Res, Body, Get } from '@nestjs/common';
import { Response } from 'express';
import { SubscriptionService } from '@/subscription/subscription.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';
import { CreateCheckoutSessionRequest, GetSubscriptionUsageResponse } from '@refly/openapi-schema';
import { buildSuccessResponse } from '@/utils';
import { usageMeterPO2DTO } from '@/subscription/subscription.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/createCheckoutSession')
  async createCheckoutSession(
    @User() user: UserModel,
    @Body() param: CreateCheckoutSessionRequest,
    @Res() res: Response,
  ) {
    const session = await this.subscriptionService.createCheckoutSession(user, param);
    res.redirect(303, session.url);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/createPortalSession')
  async createPortalSession(@User() user: UserModel, @Res() res: Response) {
    const session = await this.subscriptionService.createPortalSession(user);
    res.redirect(303, session.url);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/usage')
  async getUsage(@User() user: UserModel): Promise<GetSubscriptionUsageResponse> {
    const usage = await this.subscriptionService.getOrCreateUsageMeter(user);
    return buildSuccessResponse(usageMeterPO2DTO(usage));
  }
}
