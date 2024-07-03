import { SkillEvent } from '@refly/common-types';
import { SkillInfo } from '@refly/skill-template';
import { CreateChatMessageInput } from '@/conversation/conversation.dto';
import { User } from '@prisma/client';
import { SkillMeta } from '@refly/openapi-schema';
import { pick } from 'lodash';

interface MessageData {
  logs: string[];
  content: string;
  structuredData: Record<string, unknown>;
}

export class MessageAggregator {
  /**
   * Skill meta data, in the order of sending
   */
  skillMetaList: SkillMeta[] = [];

  /**
   * Message data, with key being the skill name and value being the message
   */
  data: Record<string, MessageData> = {};

  getOrInitData(skillName: string): MessageData {
    return (
      this.data[skillName] || {
        logs: [],
        content: '',
        structuredData: {},
      }
    );
  }

  registerSkillName(meta: SkillMeta) {
    if (!this.skillMetaList.some(({ skillName }) => meta.skillName === skillName)) {
      this.skillMetaList.push(pick(meta, ['skillId', 'skillName', 'skillDisplayName']));
    }
  }

  addSkillEvent(event: SkillEvent) {
    this.registerSkillName(event);

    const msg: MessageData = this.data[event.skillName] || {
      logs: [],
      content: '',
      structuredData: {},
    };
    switch (event.event) {
      case 'log':
        msg.logs.push(event.content);
        break;
      case 'structured_data':
        msg[event.structuredDataKey ?? 'default'] = event.content;
        break;
    }
    this.data[event.skillName] = msg;
  }

  setContent(info: SkillInfo, content: string) {
    this.registerSkillName(info);

    const msg = this.getOrInitData(info.skillName);
    msg.content = content;
    this.data[info.skillName] = msg;
  }

  getMessages(param: {
    user: User;
    conversationPk: number;
    locale: string;
  }): CreateChatMessageInput[] {
    const { user, conversationPk, locale } = param;

    return this.skillMetaList.map((meta) => {
      const { skillName } = meta;
      const { content, logs, structuredData } = this.data[skillName];
      return {
        type: 'ai',
        content,
        skillMeta: JSON.stringify(meta),
        logs: JSON.stringify(logs),
        structuredData: JSON.stringify(structuredData),
        userId: user.id,
        uid: user.uid,
        conversationId: conversationPk,
        locale,
      };
    });
  }
}
