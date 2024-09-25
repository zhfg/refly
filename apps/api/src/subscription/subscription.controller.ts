import { Controller, UseGuards, Post, Body, Get } from '@nestjs/common';
import { SubscriptionService } from '@/subscription/subscription.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { User } from '@/utils/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  GetSubscriptionUsageResponse,
  ListModelsResponse,
} from '@refly/openapi-schema';
import { buildSuccessResponse, pick } from '@/utils';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/createCheckoutSession')
  async createCheckoutSession(
    @User() user: UserModel,
    @Body() param: CreateCheckoutSessionRequest,
  ): Promise<CreateCheckoutSessionResponse> {
    const session = await this.subscriptionService.createCheckoutSession(user, param);
    return buildSuccessResponse({ url: session.url });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/createPortalSession')
  async createPortalSession(@User() user: UserModel): Promise<CreatePortalSessionResponse> {
    const session = await this.subscriptionService.createPortalSession(user);
    return buildSuccessResponse({ url: session.url });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/usage')
  async getUsage(@User() user: UserModel): Promise<GetSubscriptionUsageResponse> {
    const usage = await this.subscriptionService.getOrCreateUsageMeter(user);
    return buildSuccessResponse(usage);
  }

  @UseGuards(JwtAuthGuard)
  @Get('modelList')
  async listModels(): Promise<ListModelsResponse> {
    const models = await this.subscriptionService.getModelList();
    return buildSuccessResponse(models.map((m) => pick(m, ['name', 'label', 'provider', 'tier'])));
  }
}
