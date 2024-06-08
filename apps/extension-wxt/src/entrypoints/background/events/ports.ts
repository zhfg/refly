import { Runtime, browser } from 'wxt/browser';
import { TASK_STATUS } from '@/types';
import { getCookie } from '@/utils/cookie';
import { getServerOrigin } from '@refly/ai-workspace-common/utils/url';
import { getExtensionVersion } from '@/utils/version';
import { fetchStream } from '@refly/ai-workspace-common/utils/fetch-stream';
import { getRuntime } from '@refly/ai-workspace-common/utils/env';
import { getCurrentTab } from '@refly/ai-workspace-common/utils/extension/tabs';

const LLM_SPLIT = '__LLM_RESPONSE__';
const RELATED_SPLIT = '__RELATED_QUESTIONS__';

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
      const convId = payload?.convId;

      const cookie = await getCookie();

      const decoder = new TextDecoder();
      let uint8Array = new Uint8Array();
      let chunks = '';
      let sourcesEmitted = false;

      const response = await fetch(`${getServerOrigin()}/v1/conversation/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookie}`,
          'x-refly-ext-version': getExtensionVersion(),
        },
        signal: abortController.signal,
        body: JSON.stringify({
          task: { ...payload, convId },
        }),
      });
      if (response.status !== 200) {
        res.send({
          type: 'error',
          message: response.status,
        });
        return;
      }
      const markdownParse = (text: string) => {
        res.send({
          type: 'content',
          message: text
            .replace(/\[\[([cC])itation/g, '[citation')
            .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
            .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
            .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)'),
        });
      };
      fetchStream(
        response,
        (chunk) => {
          uint8Array = new Uint8Array([...uint8Array, ...chunk]);
          chunks = decoder.decode(uint8Array, { stream: true });
          if (chunks.includes(LLM_SPLIT)) {
            const [sources, rest] = chunks.split(LLM_SPLIT);
            if (!sourcesEmitted) {
              try {
                res.send({
                  type: 'source',
                  message: sources,
                });
              } catch (e) {
                res.send({
                  type: 'source',
                  message: JSON.stringify([]),
                });
              }
            }
            sourcesEmitted = true;
            if (rest.includes(RELATED_SPLIT)) {
              const [md] = rest.split(RELATED_SPLIT);
              markdownParse(md);
            } else {
              markdownParse(rest);
            }
          }
        },
        () => {
          const [_, relates] = chunks.split(RELATED_SPLIT);
          try {
            res.send({
              type: 'relatedQuestions',
              message: relates,
            });
          } catch (e) {
            res.send({
              type: 'relatedQuestions',
              message: JSON.stringify([]),
            });
          }
        },
      );
    } else if (type === TASK_STATUS.SHUTDOWN) {
      abortController.abort();
      res.send({ message: '[DONE]' });
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
          const runtime = message?.source;

          if (runtime === 'extension-csui') {
            const tab = await getCurrentTab();
            browser.tabs.sendMessage(tab?.id as number, msg).catch((err) => {
              console.log('onPort send message error', err);
            });
          } else if (runtime === 'extension-sidepanel') {
            port?.postMessage(msg);
          }
        },
      });
    }
  });
};
