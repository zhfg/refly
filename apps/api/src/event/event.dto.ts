import { EntityType, EventType } from '@refly/openapi-schema';

export interface ReportEventData {
  uid: string;
  entityType: EntityType;
  entityId: string;
  eventType: EventType;
}
