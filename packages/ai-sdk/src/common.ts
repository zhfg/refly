import { useRef } from 'react';
import { LOCALE, MessageState, RelatedQuestion, TASK_STATUS, TASK_TYPE } from '@refly/common-types';

import { buildErrorMessage, buildQuestionMessage, buildReplyMessage } from '@refly/utils/message';
import { type ChatTask, type Source } from '@refly/openapi-schema';
import { parseStreaming } from '@refly/utils/parse-streaming';
import { useChatTaskStore } from './state';
import { buildConversation } from '@refly/utils/conversation';

// stores
/**
 *
 * 1. runtime
 */

interface ChatProps {
  onError?: (status: number) => void;
  onResponse?: (response: Response) => void;
}

export interface TaskContext {
  type: 'text' | 'weblink' | 'reading-resource' | 'knowledge-base' | 'note';
  content: string | string[]; // 如果是 text 则代表选中内容，如果是其他则代表对应的资源 id
}

export interface TaskConfig {
  locale: LOCALE;
  convId?: string; // 如果有，代表是同一个对话，否则是新的会话
}

export const useCommonAITask = (props: ChatProps) => {
  const chatTaskStore = useChatTaskStore();
  // 中断生成
  const controllerRef = useRef<AbortController>();
  const resolveRef = useRef<(value: any) => void>();
  const rejectRef = useRef<(err: any) => void>();

  const ensureConversationExist = (config: TaskConfig) => {
    const { currentConversation } = useChatTaskStore.getState();

    if (!config?.convId) {
      const newConv = buildConversation({
        locale: config?.locale,
      });
      chatTaskStore.setCurrentConversation(newConv);

      return newConv;
    }

    return currentConversation;
  };

  const buildTask = ({
    userPrompt,
    context,
    config,
    taskType,
  }: {
    userPrompt: string;
    context: TaskContext;
    config: TaskConfig;
    taskType: TASK_TYPE;
  }) => {
    // support ask follow up question
    let question = '';
    if (typeof userPrompt === 'string' && userPrompt) {
      question = userPrompt;
    }

    // 处理会话
    const conv = ensureConversationExist(config);
    // 如果是新会话，则清空之前的状态，否则支持可以临时状态追问
    if (!config?.convId) {
      chatTaskStore.resetState();
    }

    // 构建上下文
    let selectedWebLink: Source[] = [];
    let resourceIds: string[] = [];
    let collectionIds: string[] = [];

    // 选中内容，或者什么内容都不选中的常识问答
    if (context?.type === 'text' || context?.type === 'weblink') {
      selectedWebLink = [
        {
          pageContent: '',
          metadata: {
            title: '',
            source: '',
          },
          score: -1, // 手工构造
          selections: [
            {
              type: 'text',
              xPath: '',
              content: (context?.content as string) || '',
            },
          ],
        },
      ];
    } else if (context?.type === 'reading-resource' || context?.type === 'note') {
      resourceIds = Array.isArray(context?.content) ? context?.content : [(context?.content as string) || ''];
    } else if (context.type === 'knowledge-base') {
      collectionIds = Array.isArray(context?.content) ? context?.content : [(context?.content as string) || ''];
    }

    // 设置当前的任务类型及会话 id
    const task: ChatTask = {
      taskType,
      data: {
        question,
        filter: { weblinkList: selectedWebLink, resourceIds, collectionIds },
      },
      locale: config?.locale || LOCALE.EN,
      convId: conv?.convId || '',
      ...(conv?.messages?.length > 0 ? {} : { createConvParam: { ...conv } }),
    };

    // 构建消息
    const { messages = [] } = useChatTaskStore.getState();

    // 构建 filter, for follow ask question config
    const weblinkList = task?.data?.filter?.weblinkList || [];
    const selectedWeblinkConfig = {
      searchTarget: weblinkList?.length > 0 ? 'selectedPages' : 'all',
      filter: weblinkList,
    };

    const questionMsg = buildQuestionMessage({
      convId: conv?.convId || '',
      content: question,
      selectedWeblinkConfig: JSON.stringify(selectedWeblinkConfig),
    });
    const replyMsg = buildReplyMessage({
      convId: conv?.convId || '',
      content: '',
      questionId: questionMsg?.msgId,
    });
    // 将 reply 加到 message-state
    chatTaskStore.setMessageState({
      pendingReplyMsg: replyMsg,
    });

    chatTaskStore.setMessages(messages.concat(questionMsg));

    return task;
  };

  const onContent = (content: string) => {
    const currentChatTaskState = useChatTaskStore.getState();

    // 没有消息时，先创建
    const lastMessage = currentChatTaskState.messages.at(-1);
    const savedMessage = currentChatTaskState.messages.slice(0, -1);

    lastMessage.content = content;
    chatTaskStore.setMessages([...savedMessage, { ...lastMessage }]);
  };

  const onSources = (sources: Source[]) => {
    const currentChatTaskState = useChatTaskStore.getState();

    let lastMessage, savedMessage;
    if (currentChatTaskState.pendingFirstToken) {
      lastMessage = currentChatTaskState.pendingReplyMsg;
      savedMessage = currentChatTaskState.messages;

      lastMessage.content = '';
      chatTaskStore.setMessageState({ pendingFirstToken: false });
    } else {
      lastMessage = currentChatTaskState.messages.at(-1);
      savedMessage = currentChatTaskState.messages.slice(0, -1);
    }

    console.log('sourceWeblinkPayload', sources);
    chatTaskStore.setMessageState({
      ...currentChatTaskState,
      pendingFirstToken: false,
      pending: true,
      pendingSourceDocs: (currentChatTaskState.pendingSourceDocs || [])?.concat(sources)?.filter((item) => item),
    });

    console.log('sourceWeblinkPayload', currentChatTaskState.messages);

    if (Array.isArray(lastMessage?.sources)) {
      lastMessage.sources = lastMessage?.sources?.concat(sources || [])?.filter((item) => item);
    } else {
      lastMessage.sources = [...sources]?.filter((item) => item);
    }
    chatTaskStore.setMessages([...savedMessage, { ...lastMessage }]);

    // 更新消息之后滚动到底部
    // setTimeout(() => {
    //   scrollToBottom();
    // }, 1000);
  };

  const onRelated = (related: RelatedQuestion[]) => {
    const currentChatTaskState = useChatTaskStore.getState();

    console.log('related question', related);
    chatTaskStore.setMessageState({
      ...currentChatTaskState,
      pending: false,
      pendingFirstToken: true,
      pendingRelatedQuestions: (currentChatTaskState.pendingRelatedQuestions || [])
        ?.concat(related)
        ?.filter((item) => item),
    });

    const lastMessage = currentChatTaskState.messages.at(-1);
    const savedMessage = currentChatTaskState.messages.slice(0, -1);

    console.log('latest related question', lastMessage?.relatedQuestions);

    if (Array.isArray(lastMessage?.relatedQuestions)) {
      lastMessage.relatedQuestions = lastMessage?.relatedQuestions?.concat(related || [])?.filter((item) => item);
    } else {
      lastMessage.relatedQuestions = [...related]?.filter((item) => item);
    }
    chatTaskStore.setMessages([...savedMessage, { ...lastMessage }]);

    // 完成流程
    resolveRef.current?.(lastMessage);
  };

  const onError = (status: number) => {
    const currentChatState = useChatTaskStore.getState();
    console.log('status', status);

    // 结束服务
    controllerRef.current?.abort();

    const newMessageState: Partial<MessageState> = {
      pending: false,
      error: false,
    };

    // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
    const errMsg = buildErrorMessage({
      convId: chatTaskStore.currentConversation?.convId || '',
    });

    chatTaskStore.setMessages([...currentChatState.messages, { ...errMsg }]);

    // 更新消息之后滚动到底部
    // setTimeout(() => {
    //   scrollToBottom();
    // }, 1000);

    newMessageState.error = true;
    newMessageState.pendingFirstToken = false;

    // 更新 messageState 的状态，然后直接结束，不走后面的流程
    chatTaskStore.setMessageState(newMessageState);
    props.onError(status);
    rejectRef.current?.(errMsg); // 结束流程
  };

  const onResponse = (response: Response) => {
    props?.onResponse?.(response);
  };

  // Web 和插件分块处理
  const handleSendMessage = (payload: {
    body: {
      type: TASK_STATUS;
      payload?: ChatTask;
    };
  }) => {
    controllerRef.current = new AbortController();

    parseStreaming(controllerRef.current, payload?.body?.payload, onSources, onContent, onRelated, onError, onResponse);
  };

  const buildTaskAndGenReponse = ({
    userPrompt,
    context,
    config,
    taskType,
    resolve,
    reject,
  }: {
    userPrompt: string;
    context: TaskContext;
    config: TaskConfig;
    taskType: TASK_TYPE;
    resolve: (value: any) => void;
    reject: (err: any) => void;
  }) => {
    // 定位为一次性的 task 执行，所以每次执行新任务时，都需要清空之前的状态
    const task = buildTask({
      userPrompt,
      context,
      config,
      taskType,
    });

    // 直接发送 task
    handleSendMessage({
      body: {
        type: TASK_STATUS.START,
        payload: task,
      },
    });

    // 构建处理函数
    resolveRef.current = resolve;
    rejectRef.current = reject;
  };

  const stop = () => {
    controllerRef.current?.abort();
    rejectRef.current?.('Process has been interrupted'); // 中断之后，直接 reject
  };

  console.log('chatTaskStore', chatTaskStore.pendingMsg);
  const lastMessage = chatTaskStore?.messages?.[chatTaskStore.messages?.length - 1];

  return {
    buildTaskAndGenReponse,
    stop,
    completion: lastMessage?.content || '',
    completionMsg: lastMessage || null,
    messages: chatTaskStore.messages,
    sources: chatTaskStore.pendingSourceDocs,
    relatedQuestions: chatTaskStore.pendingRelatedQuestions,
    isLoading: chatTaskStore.pending,
    conversation: chatTaskStore.currentConversation,
  };
};
