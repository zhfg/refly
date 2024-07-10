import { useCallback, useRef } from 'react';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { Source } from '@refly/openapi-schema';
import type { MessageState, RelatedQuestion, SkillEvent } from '@refly/common-types';
import { TASK_STATUS } from '@refly/common-types';
import type { ChatTask, InvokeSkillRequest, ChatMessage } from '@refly/openapi-schema';
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
// stores

export const useBuildTask = () => {
  const streamingChatPortRef = useRef<Runtime.Port>();
  const chatStore = useChatStore();
  const messageStateStore = useMessageStateStore();
  const conversationStore = useConversationStore();
  // 中断生成
  const controllerRef = useRef<AbortController>();

  const buildTaskAndGenReponse = (task: InvokeSkillRequest) => {
    console.log('buildTaskAndGenReponse', task);
    const question = task?.input?.query;
    const { messages = [] } = useChatStore.getState();
    const { currentConversation } = useConversationStore.getState();
    const { skillInstances = [], selectedSkill } = useSkillStore.getState();

    // 构建 filter, for follow ask question config
    // const weblinkList =
    // const selectedWeblinkConfig = {
    //   searchTarget: weblinkList?.length > 0 ? 'selectedPages' : 'all',
    //   filter: weblinkList,
    // };

    // Skill 和 Message 绑定，某条 AI Message 来自哪个 Skill
    const questionMsg = buildQuestionMessage({
      content: question,
      ...(selectedSkill
        ? {
            skillMeta: {
              skillName: selectedSkill.skillName,
              skillId: selectedSkill.skillId,
              skillDisplayName: selectedSkill.skillDisplayName,
            },
          }
        : {}),
      // selectedWeblinkConfig: JSON.stringify(selectedWeblinkConfig), // 先 deprecated
    });
    // 将 reply 加到 message-state
    messageStateStore.setMessageState({
      nowInvokeSkillId: task?.skillId,
    });

    chatStore.setMessages(messages.concat(questionMsg));

    handleGenResponse(task);

    setTimeout(() => {
      // 滑动到底部
      scrollToBottom();
    });
  };

  const buildShutdownTaskAndGenResponse = () => {
    controllerRef.current?.abort();
    handleSendMessage({
      body: {
        type: TASK_STATUS.SHUTDOWN,
      },
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
      handleSendMessage({
        body: {
          type: TASK_STATUS.START,
          payload: task,
        },
      });
    },
    [conversationStore.currentConversation?.convId],
  );

  const onSkillStart = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();

    const lastRelatedMessage = [...messages]
      .reverse()
      .find(
        (item) =>
          item?.skillMeta?.skillName === skillEvent?.skillName &&
          item?.type === 'ai' &&
          item?.spanId === skillEvent?.spanId,
      );

    // 同一个技能对应的 spanId 只创建一条消息
    if (lastRelatedMessage) {
      return;
    }

    // 每次 start 开启一条新的 msg
    const replyMsg = buildReplyMessage({
      content: '',
      skillMeta: {
        skillName: skillEvent?.skillName,
        skillId: skillEvent?.skillId,
        skillDisplayName: skillEvent?.skillDisplayName,
      },
      spanId: skillEvent?.spanId,
      pending: true,
    });

    // 将 reply 加到 message-state
    messageStateStore.setMessageState({
      pendingReplyMsg: replyMsg,
      pending: true, // 开始加载 skill 消息
      pendingFirstToken: true, // 收到第一个字符
      nowInvokeSkillId: skillEvent?.skillId,
    });

    chatStore.setMessages(messages.concat(replyMsg));

    setTimeout(() => {
      // 滑动到底部
      scrollToBottom();
    });
  };

  const onSkillThoughout = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = [...messages]
      .reverse()
      .find(
        (item) =>
          item?.skillMeta?.skillName === skillEvent?.skillName &&
          item?.type === 'ai' &&
          item?.spanId === skillEvent?.spanId,
      );
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

  const onSkillStream = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const { pendingFirstToken } = useMessageStateStore.getState();
    const lastRelatedMessage = [...messages]
      .reverse()
      .find(
        (item) =>
          item?.skillMeta?.skillName === skillEvent?.skillName &&
          item?.type === 'ai' &&
          item?.spanId === skillEvent?.spanId,
      );
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    if (!lastRelatedMessage.content) {
      lastRelatedMessage.content = '';
    }

    lastRelatedMessage.content += skillEvent.content;

    // 处理 Citation 的序列号
    lastRelatedMessage.content = lastRelatedMessage.content
      .replace(/\[\[([cC])itation/g, '[citation')
      .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
      .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
      .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)');

    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);

    if (pendingFirstToken) {
      messageStateStore.setMessageState({ pendingFirstToken: false });
    }

    setTimeout(() => {
      // 滑动到底部
      scrollToBottom();
    });
  };

  const onSkillStructedData = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = [...messages]
      .reverse()
      .find(
        (item) =>
          item?.skillMeta?.skillName === skillEvent?.skillName &&
          item?.type === 'ai' &&
          item?.spanId === skillEvent?.spanId,
      );
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

    if (['source', 'relatedQuestions'].includes(skillEvent?.structuredDataKey)) {
      if (skillEvent.structuredDataKey[skillEvent.structuredDataKey]) {
        lastRelatedMessage.structuredData[skillEvent.structuredDataKey] = [...(structuredData || [])];
      } else {
        lastRelatedMessage.structuredData[skillEvent.structuredDataKey] = (
          lastRelatedMessage.structuredData[skillEvent.structuredDataKey] as Array<any>
        )?.concat(...structuredData);
      }
    } else if (skillEvent?.structuredDataKey === 'AskUserForm') {
      // TODO: 未来实现
    }

    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);
  };

  const onSkillEnd = (skillEvent: SkillEvent) => {
    const { messages = [] } = useChatStore.getState();
    const lastRelatedMessage = [...messages]
      .reverse()
      .find(
        (item) =>
          item?.skillMeta?.skillName === skillEvent?.skillName &&
          item?.type === 'ai' &&
          item?.spanId === skillEvent?.spanId,
      );
    const lastRelatedMessageIndex = messages.findIndex((item) => item.msgId === lastRelatedMessage?.msgId);

    if (!lastRelatedMessage) {
      return;
    }

    lastRelatedMessage.pending = false;
    messages[lastRelatedMessageIndex] = lastRelatedMessage;
    chatStore.setMessages(messages);
  };

  const onError = (status: number) => {
    const currentChatState = useChatStore.getState();
    console.log('status', status);
    controllerRef.current?.abort();

    const newMessageState: Partial<MessageState> = {
      pending: false,
      error: false,
    };

    // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
    const errMsg = buildErrorMessage({
      content: `发生错误，错误信息：${status}`, // TODO: 优化错误信息的展示
    });

    chatStore.setMessages([...currentChatState.messages, { ...errMsg }]);

    // 更新消息之后滚动到底部
    setTimeout(() => {
      scrollToBottom();
    }, 1000);

    newMessageState.error = true;
    newMessageState.pendingFirstToken = false;

    // 更新 messageState 的状态，然后直接结束，不走后面的流程
    messageStateStore.setMessageState(newMessageState);
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

  const handleSendMessage = (payload: {
    body: {
      type: TASK_STATUS;
      payload?: InvokeSkillRequest;
    };
  }) => {
    const { runtime } = useUserStore.getState();
    console.log('handleSendMessage runtime', runtime);
    if (runtime?.includes('extension')) {
      return handleSendMessageFromExtension(payload);
    } else {
      return handleSendMessageFromWeb(payload);
    }
  };

  const handleSendMessageFromWeb = (payload: {
    body: {
      type: TASK_STATUS;
      payload?: InvokeSkillRequest;
    };
  }) => {
    controllerRef.current = new AbortController();

    ssePost({
      controller: controllerRef.current,
      payload: payload?.body?.payload,
      onStart,
      onSkillStart,
      onSkillStream,
      onSkillThoughout,
      onSkillStructedData,
      onSkillEnd,
      onCompleted,
      onError,
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
      case 'skill-log':
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
    }
  };

  const bindExtensionPorts = async () => {
    const portRes = await getPort('streaming-chat' as never);
    if (portRes?.isNew || !streamingChatPortRef.current) {
      streamingChatPortRef.current = portRes.port;
      streamingChatPortRef.current?.onMessage?.removeListener?.(handleStreamingMessage);
      streamingChatPortRef.current?.onMessage.addListener(handleStreamingMessage);
    }
  };

  const handleSendMessageFromExtension = async (payload: { body: any }) => {
    await bindExtensionPorts();

    // 生成任务
    streamingChatPortRef.current?.postMessage({
      ...payload,
      source: getRuntime(),
    });
  };

  return {
    buildTaskAndGenReponse,
    buildShutdownTaskAndGenResponse,
  };
};
