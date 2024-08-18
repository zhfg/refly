import { getAuthTokenFromCookie } from './request';
import { getServerOrigin } from '@refly/utils/url';
import { InvokeSkillRequest } from '@refly/openapi-schema';
import { SkillEvent } from '@refly/common-types';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getCookie } from '@refly-packages/ai-workspace-common/utils/cookie';

export const ssePost = async ({
  controller,
  token,
  payload,
  onStart,
  onSkillThoughout,
  onSkillStart,
  onSkillStream,
  onSkillEnd,
  onSkillStructedData,
  onError,
  onCompleted,
}: {
  controller: AbortController;
  token: string;
  payload: InvokeSkillRequest;
  onStart: () => void;
  onSkillThoughout: (event: SkillEvent) => void;
  onSkillStart: (event: SkillEvent) => void;
  onSkillStream: (event: SkillEvent) => void;
  onSkillEnd: (event: SkillEvent) => void;
  onSkillStructedData: (event: SkillEvent) => void;
  onError?: (status: any) => void;
  onCompleted?: (val?: boolean) => void;
}) => {
  // const response = await getClient().streamInvokeSkill({
  //   body: payload,
  //   signal: controller.signal,
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   method: 'POST',
  // });
  const response = await fetch(`${getServerOrigin()}/v1/skill/streamInvoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
    body: JSON.stringify(payload),
  });
  if (response.status !== 200) {
    onError?.(response.status as number);
    return;
  }

  // const markdownParse = (text: string) => {
  //   onMarkdown(
  //     text
  // .replace(/\[\[([cC])itation/g, '[citation')
  // .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
  // .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
  // .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)'),
  //   );
  // };

  const reader = response.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  let isSkillFirstMessage = true;
  let bufferStr = '';

  const read = () => {
    let hasError = false;

    reader?.read().then((result) => {
      if (result?.done) {
        onCompleted?.();

        return;
      }

      bufferStr += decoder.decode(result.value, { stream: true });
      const lines = bufferStr.split('\n');
      let skillEvent: SkillEvent;

      try {
        lines?.forEach((message) => {
          if (message.startsWith('data: ')) {
            try {
              skillEvent = JSON.parse(message.substring(6)) as SkillEvent;
            } catch (err) {
              console.log('ssePost 消息解析错误，静默失败：', err); // 这里只是解析错误，可以静默失败
              return;
            }

            // TODO 后续增加 skillEvent 可以处理错误的情况

            if (skillEvent?.event === 'start') {
              if (isSkillFirstMessage) {
                onSkillStart(skillEvent);
              }
            } else if (skillEvent?.event === 'log') {
              onSkillThoughout(skillEvent);
            } else if (skillEvent?.event === 'end') {
              onSkillEnd(skillEvent);
              isSkillFirstMessage = true;
            } else if (skillEvent?.event === 'stream') {
              onSkillStream(skillEvent);
            } else if (skillEvent?.event === 'structured_data') {
              onSkillStructedData(skillEvent);
            }
          }
        });

        bufferStr = lines[lines.length - 1];
      } catch (err) {
        onError(err);
        onCompleted?.(true);
        hasError = true;

        return;
      }

      if (!hasError) {
        read();
      }
    });
  };

  read();
};
