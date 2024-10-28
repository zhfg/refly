import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import type { MessageState, ClientChatMessage, OutputLocale, SkillEvent } from '@refly/common-types';
import {
  useMessageStateStore,
  useMessageStateStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/message-state';
import { useConversationStoreShallow } from '@refly-packages/ai-workspace-common/stores/conversation';
import { CanvasIntentType, TASK_STATUS } from '@refly/common-types';
import { InvokeSkillRequest, SkillMeta } from '@refly/openapi-schema';
import { buildQuestionMessage, buildReplyMessage } from '@refly-packages/ai-workspace-common/utils/message';

import { buildErrorMessage } from '@refly-packages/ai-workspace-common/utils/message';
import { scrollToBottom } from '@refly-packages/ai-workspace-common/utils/ui';

// requests
import { ssePost } from '@refly-packages/ai-workspace-common/utils/sse-post';
import { Runtime } from 'wxt/browser';
import { getPort, removePort } from '@refly-packages/ai-workspace-common/utils/extension/ports';
import { safeParseJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { getAuthTokenFromCookie } from '@refly-packages/utils/request';
import { genUniqueId } from '@refly-packages/utils/id';
import { markdownCitationParse } from '@refly-packages/utils/parse';

import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { getCanvasContent } from '@refly-packages/ai-workspace-common/components/copilot/utils';

// hooks
import { IntentResult, useHandleAICanvas } from './use-handle-ai-canvas';

const globalStreamingChatPortRef = { current: null as Runtime.Port | null };
const globalAbortControllerRef = { current: null as AbortController | null };
const globalIsAbortedRef = { current: false as boolean };
let uniqueId = genUniqueId();

export const useBuildTask = () => {
  const chatStore = useChatStoreShallow((state) => ({
    setMessages: state.setMessages,
    setIntentMatcher: state.setIntentMatcher,
    setNowStreamCanvasContent: state.setNowStreamCanvasContent,
    setIsFirstStreamEditCanvasContent: state.setIsFirstStreamEditCanvasContent,
  }));
  const messageStateStore = useMessageStateStoreShallow((state) => ({
    setMessageState: state.setMessageState,
    resetState: state.resetState,
  }));
  const conversationStore = useConversationStoreShallow((state) => ({
    setCurrentConversation: state.setCurrentConversation,
    currentConversation: state.currentConversation,
  }));

  // hooks
  const { handleStructuredDataChange } = useHandleAICanvas();

  const { t } = useTranslation();
  const schedulerMeta: SkillMeta = {
    tplName: 'scheduler',
    displayName: t('copilot.reflyAssistant'),
    icon: { type: 'emoji', value: '🧙‍♂️' },
  };

  const findLastRelatedMessage = (messages: ClientChatMessage[], skillEvent: SkillEvent) => {
    const lastRelatedMessage = [...messages]
      .reverse()
      .find(
        (item) =>
          item?.skillMeta?.tplName === skillEvent?.skillMeta?.tplName &&
          item?.type === 'ai' &&
          item?.spanId === skillEvent?.spanId,
      );
    return lastRelatedMessage;
  };

  const onSkillStart = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    console.log('onSkillStart messages', messages);

    const lastMessage = messages[messages.length - 1];

    // If the last message is from the same skill, update its spanId
    if (lastMessage?.skillMeta?.skillId === skillEvent?.skillMeta?.skillId) {
      lastMessage.spanId = skillEvent?.spanId;
      chatStore.setMessages(messages);
    } else {
      // Otherwise, create a new reply message
      const replyMsg = buildReplyMessage({
        content: '',
        skillMeta: skillEvent.skillMeta,
        spanId: skillEvent?.spanId,
        pending: true,
      });

      messageStateStore.setMessageState({
        pendingReplyMsg: replyMsg,
        pending: true,
        pendingFirstToken: true,
        nowInvokeSkillId: skillEvent?.skillMeta?.skillId,
      });

      chatStore.setMessages(messages.concat(replyMsg));
    }
  };

  const onSkillThoughout = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = findLastRelatedMessage(messages, skillEvent);
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    if (!lastRelatedMessage?.logs) {
      lastRelatedMessage.logs = [skillEvent.content];
    } else {
      lastRelatedMessage.logs = lastRelatedMessage.logs.concat(skillEvent.content);
    }

    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);
  };

  const onSkillUsage = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = findLastRelatedMessage(messages, skillEvent);
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    const tokenUsage = safeParseJSON(skillEvent.content);
    if (!tokenUsage?.token.length) {
      return;
    }

    lastRelatedMessage.tokenUsage = tokenUsage.token;
    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);
  };

  const onSkillStream = (skillEvent: SkillEvent) => {
    const {
      messages = [],
      nowStreamCanvasContent = '',
      isFirstStreamEditCanvasContent = true,
    } = useChatStore.getState();
    const { pendingFirstToken } = useMessageStateStore.getState();
    const lastRelatedMessage = findLastRelatedMessage(messages, skillEvent);
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    if (!lastRelatedMessage.content) {
      lastRelatedMessage.content = '';
      chatStore.setNowStreamCanvasContent('');
    }

    // 获取更新前的 canvas 内容
    const prevCanvasContent = getCanvasContent(lastRelatedMessage.content);

    // 更新消息内容
    lastRelatedMessage.content += skillEvent.content;

    // 获取更新后的 canvas 内容
    const currentCanvasContent = getCanvasContent(lastRelatedMessage.content);

    // 计算增量内容
    const incrementalContent = currentCanvasContent.slice(prevCanvasContent.length);

    // 处理 Citation 的序列号
    lastRelatedMessage.content = markdownCitationParse(lastRelatedMessage.content);
    const newNowStreamCanvasContent = nowStreamCanvasContent + incrementalContent;

    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);
    chatStore.setNowStreamCanvasContent(newNowStreamCanvasContent);

    if (pendingFirstToken && lastRelatedMessage.content.trim()) {
      messageStateStore.setMessageState({ pendingFirstToken: false });
    }

    // 如果是画布内容且有增量内容，发送到编辑器
    const intentMatcher = lastRelatedMessage?.structuredData?.intentMatcher as IntentResult;
    if (intentMatcher?.type === CanvasIntentType.GenerateCanvas && incrementalContent) {
      // TODO: 不应该流式的插入内容，而是应该类似事务一样处理，能够看到内容，但是可以一键 undo，以及能够自动处理 markdown 到 tiptap 编辑器转换的渲染，目前没有处理
      editorEmitter.emit('streamCanvasContent', incrementalContent);
    } else if (intentMatcher?.type === CanvasIntentType.EditCanvas && incrementalContent) {
      editorEmitter.emit('streamEditCanvasContent', {
        isFirst: isFirstStreamEditCanvasContent,
        content: incrementalContent,
      });

      if (isFirstStreamEditCanvasContent) {
        const newIsFirstStreamEditCanvasContent = !isFirstStreamEditCanvasContent;
        chatStore.setIsFirstStreamEditCanvasContent(newIsFirstStreamEditCanvasContent);
      }
    }
  };

  const onSkillStructedData = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = findLastRelatedMessage(messages, skillEvent);
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    if (!lastRelatedMessage?.structuredData) {
      lastRelatedMessage.structuredData = {};
    }

    const structuredData = safeParseJSON(skillEvent?.content);
    if (!structuredData) {
      return;
    }

    if (['sources', 'relatedQuestions', 'intentMatcher'].includes(skillEvent?.structuredDataKey)) {
      let existingData = lastRelatedMessage.structuredData[skillEvent.structuredDataKey];
      const isObject = (val: unknown): val is Record<string, unknown> =>
        typeof val === 'object' && val !== null && !Array.isArray(val);

      if (!existingData) {
        lastRelatedMessage.structuredData[skillEvent.structuredDataKey] = Array.isArray(structuredData)
          ? [...structuredData]
          : isObject(structuredData)
            ? { ...structuredData }
            : structuredData;
      } else {
        lastRelatedMessage.structuredData[skillEvent.structuredDataKey] =
          Array.isArray(existingData) && Array.isArray(structuredData)
            ? [...existingData, ...structuredData]
            : isObject(existingData) && isObject(structuredData)
              ? { ...existingData, ...structuredData }
              : structuredData;
      }
    } else if (skillEvent?.structuredDataKey === 'AskUserForm') {
      // TODO: 未来实现
    }

    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);

    if (skillEvent?.structuredDataKey === 'intentMatcher') {
      handleStructuredDataChange(lastRelatedMessage);
      chatStore.setIntentMatcher(structuredData);
    }
  };

  const onSkillEnd = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = findLastRelatedMessage(messages, skillEvent);
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    lastRelatedMessage.pending = false;
    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);
  };

  const buildErrMsgAndAppendToChat = (msg: string) => {
    const currentChatState = useChatStore.getState();

    const newMessageState: Partial<MessageState> = {
      pending: false,
      error: false,
    };

    // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
    const errMsg = buildErrorMessage({
      content: msg, // TODO: 优化错误信息的展示
    });

    chatStore.setMessages([...currentChatState.messages, { ...errMsg }]);

    newMessageState.error = true;
    newMessageState.pendingFirstToken = false;

    // 更新 messageState 的状态，然后直接结束，不走后面的流程
    messageStateStore.setMessageState(newMessageState);
  };

  const buildShutdownTaskAndGenResponse = (msg?: string) => {
    const { localSettings } = useUserStore.getState();
    const locale = localSettings?.outputLocale as OutputLocale;

    // extension and web all support abort
    try {
      globalAbortControllerRef.current?.abort();
      globalIsAbortedRef.current = true;
    } catch (err) {
      console.log('shutdown error', err);
    }

    console.log('streamingChatPortRef.current', globalStreamingChatPortRef.current);
    const runtime = getRuntime();
    if (runtime?.includes('extension')) {
      // extension 需要发送一个 abort 事件
      globalStreamingChatPortRef.current?.postMessage({
        body: {
          type: TASK_STATUS.SHUTDOWN,
        },
        source: runtime,
        uniqueId,
      });
    }

    // last message pending to false, and set error to true
    const { messages = [] } = useChatStore.getState();
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.pending) {
      lastMessage.pending = false;
    }
    chatStore.setMessages([...messages.slice(0, -1), lastMessage]);

    const errorMsg = msg || (locale?.includes('zh') ? '你已经终止了技能运行' : 'You have terminated the skill run');
    buildErrMsgAndAppendToChat(errorMsg);
    messageStateStore.resetState();
    // 更新消息之后滚动到底部
    setTimeout(() => {
      scrollToBottom();
    }, 1000);
  };

  const onError = (msg: string) => {
    const runtime = getRuntime();

    if (runtime?.includes('extension')) {
      if (globalIsAbortedRef.current) {
        return;
      }
    } else {
      // if it is aborted, do nothing
      if (globalAbortControllerRef.current?.signal?.aborted) {
        return;
      }
    }

    buildShutdownTaskAndGenResponse(msg);
  };

  const onCompleted = () => {
    messageStateStore.setMessageState({
      pending: false,
    });
  };

  const onStart = () => {
    messageStateStore.setMessageState({
      pending: true,
    });
  };

  const handleSendSSERequest = (payload: {
    body: {
      type: TASK_STATUS;
      payload?: InvokeSkillRequest;
    };
  }) => {
    const runtime = getRuntime();
    if (runtime?.includes('extension')) {
      return handleSendSSERequestFromExtension(payload);
    } else {
      return handleSendSSERequestFromWeb(payload);
    }
  };

  const handleSendSSERequestFromWeb = (payload: {
    body: {
      type: TASK_STATUS;
      payload?: InvokeSkillRequest;
    };
  }) => {
    globalAbortControllerRef.current = new AbortController();

    ssePost({
      controller: globalAbortControllerRef.current,
      payload: payload?.body?.payload,
      token: getAuthTokenFromCookie(),
      onStart,
      onSkillStart,
      onSkillStream,
      onSkillThoughout,
      onSkillStructedData,
      onSkillEnd,
      onCompleted,
      onError,
      onSkillUsage,
    });
  };

  /**
   * For extension send message
   * @param msg
   * @returns
   */
  const handleStreamingMessage = (msg: { type: string; message: any }) => {
    console.log('handleStreamingMessage', msg);
    switch (msg?.type) {
      case 'start':
        return onStart();
      case 'skill-start':
        return onSkillStart(msg?.message);
      case 'skill-thought':
        return onSkillThoughout(msg?.message);
      case 'skill-stream':
        return onSkillStream(msg?.message);
      case 'skill-end':
        return onSkillEnd(msg?.message);
      case 'skill-structuredData':
        return onSkillStructedData(msg?.message);
      case 'completed':
        return onCompleted();
      case 'error':
        return onError(msg?.message);
      case 'usage':
        return onSkillUsage(msg?.message);
    }
  };

  const bindExtensionPorts = async () => {
    const portRes = await getPort('streaming-chat' as never);
    if (portRes?.port) {
      globalStreamingChatPortRef.current = portRes.port;
      globalStreamingChatPortRef.current?.onMessage?.removeListener?.(handleStreamingMessage);
      globalStreamingChatPortRef.current?.onMessage.addListener(handleStreamingMessage);
    }
  };

  const unbindExtensionPorts = async () => {
    globalStreamingChatPortRef.current?.onMessage.removeListener?.(handleStreamingMessage);
    await removePort('streaming-chat');
    globalStreamingChatPortRef.current = null;
  };

  const handleSendSSERequestFromExtension = async (payload: { body: any }) => {
    await unbindExtensionPorts();
    await bindExtensionPorts();

    uniqueId = genUniqueId(); // 每次使用最新的
    globalIsAbortedRef.current = false;

    // 生成任务
    globalStreamingChatPortRef.current?.postMessage({
      ...payload,
      source: getRuntime(),
      uniqueId,
    });
  };

  const buildTaskAndGenReponse = (task: InvokeSkillRequest) => {
    const question = task?.input?.query;
    const context = task?.context || {};
    const { messages = [] } = useChatStore.getState();
    const { skillInstances = [] } = useSkillStore.getState();

    const selectedSkillInstance = skillInstances.find((item) => item.skillId === task.skillId);
    const questionMsg = buildQuestionMessage({
      content: question,
      invokeParam: {
        context,
      },
      ...(selectedSkillInstance
        ? {
            skillMeta: {
              tplName: selectedSkillInstance.tplName,
              skillId: selectedSkillInstance.skillId,
              displayName: selectedSkillInstance.displayName,
            },
          }
        : {}),
    });
    messageStateStore.setMessageState({
      nowInvokeSkillId: task?.skillId,
    });

    // Immediately build a reply message after the question message
    // for better user experience
    const replyMsg = buildReplyMessage({
      content: '',
      skillMeta: selectedSkillInstance ?? schedulerMeta,
      spanId: '',
      pending: true,
    });
    messageStateStore.setMessageState({
      pendingReplyMsg: replyMsg,
      pending: true,
      pendingFirstToken: true,
      nowInvokeSkillId: selectedSkillInstance?.skillId,
    });

    chatStore.setMessages(messages.concat(questionMsg, replyMsg));

    handleGenResponse(task);

    setTimeout(() => {
      scrollToBottom();
    });
  };

  const handleGenResponse = useCallback(
    (task: InvokeSkillRequest) => {
      // 发起一个 gen 请求，开始接收
      messageStateStore.setMessageState({
        pending: true,
        pendingFirstToken: true,
        nowInvokeSkillId: task.skillId,
        error: false,
      });

      // 直接发送 task
      handleSendSSERequest({
        body: {
          type: TASK_STATUS.START,
          payload: task,
        },
      });
    },
    [conversationStore.currentConversation?.convId],
  );

  return {
    buildTaskAndGenReponse,
    buildShutdownTaskAndGenResponse,
  };
};
