import { ClientChatMessage } from '@refly/common-types';
import { genChatMessageID } from '@refly-packages/utils/id';

export const buildQuestionMessage = (data: Partial<ClientChatMessage>): ClientChatMessage => {
  return {
    ...data,
    msgId: genChatMessageID(),
    type: 'human',
  } as ClientChatMessage;
};

export const buildReplyMessage = (data: Partial<ClientChatMessage>): ClientChatMessage => {
  return {
    ...data,
    type: 'ai',
    msgId: genChatMessageID(),
  } as ClientChatMessage;
};

export const buildErrorMessage = (data: Partial<ClientChatMessage>): ClientChatMessage => {
  return {
    ...data,
    type: 'ai',
    msgId: genChatMessageID(),
  } as ClientChatMessage;
};
