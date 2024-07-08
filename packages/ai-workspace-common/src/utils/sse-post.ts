import { fetchStream } from '@refly-packages/ai-workspace-common/utils/fetch-stream';
import { getAuthTokenFromCookie } from './request';
import { getServerOrigin } from './url';
import { InvokeSkillRequest } from '@refly/openapi-schema';
import { SkillEvent } from '@refly/common-types';

export const ssePost = async ({
  controller,
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
      Authorization: `Bearer ${getAuthTokenFromCookie()}`,
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

  const read = () => {
    let hasError = false;

    reader?.read().then((result) => {
      if (result?.done) {
        onCompleted?.();

        return;
      }

      const buffer = decoder.decode(result.value, { stream: true });
      const lines = buffer.split('\n');

      try {
        lines
          ?.filter((message) => message)
          ?.forEach((message) => {
            if (message.startsWith('data: ')) {
              try {
                const skillEvent = JSON.parse(message.substring(6)) as SkillEvent;

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
              } catch (err) {
                onError(err);
                onCompleted?.(true);
                hasError = true;
              }
            }
          });
      } catch (err) {
        onError(err);
        onCompleted?.(true);
        hasError = true;
      }

      if (!hasError) {
        read();
      }
    });
  };

  read();
};
