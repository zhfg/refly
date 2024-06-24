import type { HandlerRequest, HandlerResponse } from '@refly/common-types';
import { sendToContentScript } from '@/utils/extension/messaging';

const handler = async (req: HandlerRequest<void>): Promise<HandlerResponse<void>> => {
  console.log(req.body);
  console.log(req.body);

  await sendToContentScript({
    name: 'runRefly',
    body: {
      toggle: true,
    },
  });

  return {
    success: true,
  };
};

export default handler;
