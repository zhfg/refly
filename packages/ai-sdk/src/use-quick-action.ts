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

export const useQuickAction = (props: ChatProps) => {
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
  });

  const quickAction = async (chatProps: {
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
        taskType: TASK_TYPE.QUICK_ACTION,
        resolve,
        reject,
      });
    });

    return await promise;
  };

  return {
    quickAction,
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
