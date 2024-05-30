import { appConfig } from '@refly/utils';
import { request } from '@/utils/request';

import type { HandlerRequest, HandlerResponse } from '@/types/request';
import { Conversation, Thread } from '@/types';

const handler = async (req: HandlerRequest<Partial<Conversation>>): Promise<HandlerResponse<Thread>> => {
  console.log(req.body);

  try {
    const [err, conversationRes] = await request<Thread>(appConfig.url.createNewConversation, {
      method: 'POST',
      body: req.body,
    });
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: conversationRes,
      };
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};

export default handler;
