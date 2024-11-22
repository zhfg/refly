import { PrismaService } from '@/common/prisma.service';
import { Injectable } from '@nestjs/common';
import { GetActionResultData, User } from '@refly-packages/openapi-schema';

@Injectable()
export class ActionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActionResult(user: User, param: GetActionResultData['query']) {
    const { resultId } = param;

    return this.prisma.actionResult.findUnique({
      where: {
        resultId,
        uid: user.uid,
      },
    });
  }
}
