import { RelatedQuestion, TASK_TYPE } from '@refly/common-types';
import { ChatMessage, type Source } from '@refly/openapi-schema';
import { TaskConfig, TaskContext, useCommonAITask } from './common';

/**
 * 根据 convId 来判断是否是新的会话
 */
interface ChatProps {
  onSources?: (sources: Source[]) => void;
  onContent?: (content: string) => void;
  onRelated?: (related: RelatedQuestion[]) => void;
  onError?: (err: any) => void;
  onResponse: (response: Response) => void;
}

export const useChat = (props: ChatProps) => {
  const {
    buildTaskAndGenReponse,
    completion,
    completionMsg,
    messages,
    sources,
    relatedQuestions,
    isLoading,
    conversation,
  } = useCommonAITask({
    onError: props.onError,
    onResponse: props.onResponse,
  });

  const chat = async (chatProps: {
    userPrompt: string;
    userMessages?: ChatMessage[];
    context: TaskContext;
    config: TaskConfig;
  }) => {
    if (!chatProps.userPrompt) return;

    const promise = new Promise((resolve, reject) => {
      buildTaskAndGenReponse({
        userPrompt: chatProps.userPrompt,
        context: chatProps.context,
        config: chatProps.config,
        taskType: TASK_TYPE.CHAT,
        resolve,
        reject,
      });
    });

    return await promise;
  };

  return {
    stop,
    chat,
    completion,
    completionMsg,
    messages,
    sources,
    relatedQuestions,
    isLoading,
    conversation,
  };
};
