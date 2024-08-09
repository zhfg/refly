import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { ReportEventData } from '@/event/event.dto';
import { PrismaService } from '@/common/prisma.service';
import { genEventID } from '@refly/utils';
import { SkillContext } from '@refly/openapi-schema';
import { InjectQueue } from '@nestjs/bull';
import { CHANNEL_INVOKE_SKILL, QUEUE_SKILL } from '@/utils';
import { InvokeSkillJobData } from '@/skill/skill.dto';

@Injectable()
export class EventService {
  private logger = new Logger(EventService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_SKILL) private queue: Queue<InvokeSkillJobData>,
  ) {}

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
      const skillToTriggerMap = new Map<string, string>(
        triggers.map((trigger) => [trigger.skillId, trigger.triggerId]),
      );

      await this.queue.addBulk(
        skills.map((skill) => ({
          name: CHANNEL_INVOKE_SKILL,
          data: {
            input: { query: '' }, // TODO: support configurable input for triggers
            skillId: skill.skillId,
            context: skillContext,
            triggerId: skillToTriggerMap.get(skill.skillId),
            uid: user.uid,
          },
        })),
      );
    }
  }
}
