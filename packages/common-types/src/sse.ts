import { SkillMeta } from '@refly-packages/openapi-schema';

export interface SkillEvent {
  /**
   * The event type
   */
  event: 'start' | 'end' | 'stream' | 'log' | 'structured_data' | 'usage' | 'error';
  /**
   * The result ID
   */
  resultId?: string;
  /**
   * Event content.
   *
   * - For `start` and `end` events, `content` will be empty.
   * - For `stream` events, `content` will typically be a single token chunk.
   * - For `log` events, `content` will be the log message.
   * - For `structured_data` events, `content` will be serialized JSON data.
   * - For `error` events, `content` will be the serialized BaseResponse object.
   */
  content?: string;
  /**
   * Skill metadata
   */
  skillMeta?: SkillMeta;
  /**
   * Key for structured data, such as `relatedQuestions` and `sources`.
   * Only present when `event` is `structured_data`.
   */
  structuredDataKey?: string;
}
