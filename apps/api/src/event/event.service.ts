import { Injectable, Logger } from '@nestjs/common';
import { ReportEventData } from '@/event/event.dto';
import { PrismaService } from '@/common/prisma.service';
import { genEventID } from '@refly/utils';
import { SkillService } from '@/skill/skill.service';
import { SkillContext } from '@refly/openapi-schema';

@Injectable()
export class EventService {
  private logger = new Logger(EventService.name);

  constructor(private prisma: PrismaService, private skillService: SkillService) {}

  async handleEvent(data: ReportEventData) {
    const { uid, entityType, entityId, eventType } = data;
    const user = await this.prisma.user.findFirst({ where: { uid } });

    if (!user) {
      this.logger.warn(`user ${uid} not found, skip handle event`);
    }

    await this.prisma.eventRecord.create({
      data: {
        uid,
        eventId: genEventID(),
        entityType,
        entityId,
        eventType,
      },
    });

    const triggers = await this.prisma.skillTrigger.findMany({
      where: {
        triggerType: 'event',
        eventEntityType: entityType,
        eventType,
        enabled: true,
        deletedAt: null,
      },
    });

    if (triggers.length > 0) {
      const skillContext: SkillContext = {};
      if (entityType === 'collection') {
        skillContext.collectionIds = [entityId];
      } else if (entityType === 'resource') {
        skillContext.resourceIds = [entityId];
      } else if (entityType === 'note') {
        skillContext.noteIds = [entityId];
      }

      const skills = await this.prisma.skillInstance.findMany({
        where: { skillId: { in: triggers.map((trigger) => trigger.skillId) } },
      });
      await Promise.all(
        skills.map((skill) =>
          this.skillService.invokeSkill(user, {
            input: { query: '' },
            skillId: skill.skillId,
            context: skillContext,
          }),
        ),
      );
    }
  }
}
