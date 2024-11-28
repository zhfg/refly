import { PrismaService } from '@/common/prisma.service';
import { Injectable } from '@nestjs/common';
import { ActionResultNotFoundError } from '@refly-packages/errors';
import { GetActionResultData, User } from '@refly-packages/openapi-schema';

@Injectable()
export class ActionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActionResult(user: User, param: GetActionResultData['query']) {
    const { resultId } = param;

    const result = await this.prisma.actionResult.findUnique({
      where: {
        resultId,
        uid: user.uid,
      },
    });
    if (!result) {
      throw new ActionResultNotFoundError();
    }

    const steps = await this.prisma.actionStep.findMany({
      where: { resultId },
      orderBy: { order: 'asc' },
    });
    return { ...result, steps };
  }
}
