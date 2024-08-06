import { Runtime, browser } from 'wxt/browser';
import { TASK_STATUS, SkillEvent } from '@refly/common-types';
import { getCookie } from '@/utils/cookie';
import { getServerOrigin } from '@refly/utils/url';
import { getExtensionVersion } from '@/utils/version';
import { ssePost } from '@refly-packages/ai-workspace-common/utils/sse-post';

let abortController: AbortController;

export const handleStreamingChat = async (req: { body: any }, res: { send: (response?: any) => void }) => {
  const { type, payload } = req?.body || {};
  console.log('receive request', req.body);

  try {
    if (type === TASK_STATUS.START) {
      // 确保上一次是 aborted 了
      abortController?.abort?.();

      abortController = new AbortController();

      // TODO: 这里未来要优化
      const cookie = (await getCookie()) as string;
      ssePost({
        controller: abortController,
        payload,
        token: cookie,
        onStart: () => {
          res.send({
            type: 'start',
          });
        },
        onSkillStart: (skillEvent: SkillEvent) => {
          res.send({
            type: 'skill-start',
            message: skillEvent,
          });
        },
        onSkillStream: (skillEvent: SkillEvent) => {
          res.send({
            type: 'skill-stream',
            message: skillEvent,
          });
        },
        onSkillThoughout: (skillEvent: SkillEvent) => {
          res.send({
            type: 'skill-thought',
            message: skillEvent,
          });
        },
        onSkillStructedData: (skillEvent: SkillEvent) => {
          res.send({
            type: 'skill-structuredData',
            message: skillEvent,
          });
        },
        onSkillEnd: (skillEvent: SkillEvent) => {
          res.send({
            type: 'skill-end',
            message: skillEvent,
          });
        },
        onCompleted: () => {
          res.send({
            type: 'completed',
          });
        },
        onError: () => {
          res.send({
            type: 'error',
          });
        },
      });
    } else if (type === TASK_STATUS.SHUTDOWN) {
      // TODO: 实现终止与重试
      abortController.abort();
    }
  } catch (err) {
    console.log('err', err);
    // 最终也需要 abort 确保关闭
    abortController?.abort?.();
  }
};

export const onPort = async (port: Runtime.Port) => {
  port.onMessage.addListener(async (message: any, comingPort: Runtime.Port) => {
    if (comingPort.name === 'streaming-chat') {
      return handleStreamingChat(message, {
        send: async (msg: any) => {
          port?.postMessage(msg);
        },
      });
    }
  });
};
