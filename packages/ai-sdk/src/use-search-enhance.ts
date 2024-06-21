import { useEffect } from 'react';
import { RelatedQuestion, TASK_TYPE } from '@refly/common-types';
import { ChatMessage, type Source } from '@refly/openapi-schema';
import { TaskConfig, TaskContext, useCommonAITask } from './common';

/**
 * 根据 convId 来判断是否是新的会话
 */
interface ChatProps {
  userPrompt: string;
  userMessages: ChatMessage[];
  context: TaskContext;
  config: TaskConfig;
  onSources?: (sources: Source[]) => void;
  onContent?: (content: string) => void;
  onRelated?: (related: RelatedQuestion[]) => void;
  onError: (status: number) => void;
}

export const useSearchEnhance = (props: ChatProps) => {
  const {
    buildTaskAndGenReponse,
    completion,
    messages,
    completionMsg,
    sources,
    relatedQuestions,
    isLoading,
    conversation,
  } = useCommonAITask({
    onError: props.onError,
  });

  const search = async (chatProps: {
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
        taskType: TASK_TYPE.SEARCH_ENHANCE_ASK,
        resolve,
        reject,
      });
    });

    return await promise;
  };

  return {
    search,
    stop,
    completion,
    completionMsg,
    messages,
    sources,
    relatedQuestions,
    isLoading,
    conversation,
  };
};
