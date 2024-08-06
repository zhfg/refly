import { EntityType, EventType } from '@prisma/client';

export interface ReportEventData {
  uid: string;
  entityType: EntityType;
  entityId: string;
  eventType: EventType;
}
