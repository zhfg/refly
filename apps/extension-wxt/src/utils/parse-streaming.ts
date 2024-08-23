import { fetchStream } from '@/utils/fetch-stream';
import type { RelatedQuestion, Task } from '@refly/common-types';
import { Source } from '@refly/openapi-schema';
import { getServerOrigin } from '@refly/utils/url';
import { getCookie } from './cookie';
import { markdownCitationParse } from '@refly/utils/parse';

const LLM_SPLIT = '__LLM_RESPONSE__';
const RELATED_SPLIT = '__RELATED_QUESTIONS__';

export const parseStreaming = async (
  controller: AbortController,
  payload: Task,
  onSources: (value: Source[]) => void,
  onMarkdown: (value: string) => void,
  onRelates: (value: RelatedQuestion[]) => void,
  onError?: (status: number) => void,
) => {
  const decoder = new TextDecoder();
  let uint8Array = new Uint8Array();
  let chunks = '';
  let sourcesEmitted = false;

  const response = await fetch(`${getServerOrigin()}/v1/conversation/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getCookie()}`,
    },
    signal: controller.signal,

    body: JSON.stringify({
      task: payload,
    }),
  });
  if (response.status !== 200) {
    onError?.(response.status);
    return;
  }
  const markdownParse = (text: string) => {
    onMarkdown(markdownCitationParse(text));
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
            onSources(JSON.parse(sources));
          } catch (e) {
            onSources([]);
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
        onRelates(JSON.parse(relates));
      } catch (e) {
        onRelates([]);
      }
    },
  );
};
