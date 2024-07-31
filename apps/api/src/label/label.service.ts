import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@/common/prisma.service';
import { DeleteLabelInstanceRequest, UpsertLabelInstanceRequest } from '@refly/openapi-schema';
import { genLabelID } from '@refly/utils';

@Injectable()
export class LabelService {
  private logger = new Logger(LabelService.name);

  constructor(private prisma: PrismaService) {}

  async createLabelInstance(user: User, param: UpsertLabelInstanceRequest) {
    return this.prisma.label.create({
      data: {
        labelId: genLabelID(),
        uid: user.uid,
        icon: '',
        ...param,
      },
    });
  }

  async updateLabelInstance(param: UpsertLabelInstanceRequest) {
    return {};
  }

  async deleteLabelInstance(user: User, param: DeleteLabelInstanceRequest) {
    const { labelId } = param;
    if (!labelId) {
      throw new BadRequestException('label id are required');
    }
    const label = await this.prisma.label.findUnique({
      where: { labelId, deletedAt: null },
    });
    if (!label || label.uid !== user.uid) {
      throw new BadRequestException('label not found');
    }
    this.prisma.label.update({
      where: { labelId: label.labelId, uid: user.uid },
      data: { deletedAt: new Date() },
    });
  }
}
