import { SkillMeta } from '@refly/openapi-schema';

export interface SkillEvent {
  /**
   * The event type
   */
  event: 'start' | 'end' | 'stream' | 'log' | 'structured_data';
  /**
   * The event span, which can be used to separate events into message groups
   */
  spanId: string;
  /**
   * Event content.
   *
   * - For `start` and `end` events, `content` will be empty.
   * - For `stream` events, `content` will typically be a single token chunk.
   * - For `log` events, `content` will be the log message.
   * - For `structured_data` events, `content` will be serialized JSON data.
   */
  content?: string;
  /**
   * Skill metadata
   */
  skillMeta: SkillMeta;
  /**
   * Key for structured data, such as `relatedQuestions` and `sources`.
   * Only present when `event` is `structured_data`.
   */
  structuredDataKey?: string;
}
