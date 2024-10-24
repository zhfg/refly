import { ChatState } from './index';
import { chatHelpers } from './helpers';

const getMessageById = (id: string) => (s: ChatState) => chatHelpers.getMessageById(s.messages, id);

export const chatSelectors = {
  getMessageById,
};
