import { useEffect } from 'react';
import { RelatedQuestion, TASK_TYPE } from '@refly/common-types';
import { ChatMessage, type Source } from '@refly/openapi-schema';
import { TaskConfig, TaskContext, useCommonAITask } from '@refly/utils/hooks/ai-task/common';

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

export const useChat = (props: ChatProps) => {
  const { buildTaskAndGenReponse, content, messages, sources, relatedQuestions, isLoading, conversation } =
    useCommonAITask({
      onError: props.onError,
    });

  if (!props.userPrompt) return;

  useEffect(() => {
    buildTaskAndGenReponse({
      userPrompt: props.userPrompt,
      context: props.context,
      config: props.config,
      taskType: TASK_TYPE.CHAT,
    });
  }, [props.userPrompt]);

  return {
    stop,
    content,
    messages,
    sources,
    relatedQuestions,
    isLoading,
    conversation,
  };
};
