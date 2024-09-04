import { Controller } from '@nestjs/common';
import { SubscriptionService } from '@/subscription/subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}
}
