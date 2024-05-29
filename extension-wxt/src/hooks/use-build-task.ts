import React, {
  type Dispatch,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQuickActionStore } from "../stores/quick-action";
import { usePopupStore } from "../stores/popup";
import { useChatStore } from "../stores/chat";
import type { ChatState } from "../stores/chat";
import {
  defaultMessageState,
  useMessageStateStore,
} from "../stores/message-state";
import { useConversationStore } from "../stores/conversation";
import type {
  Message,
  MessageState,
  RelatedQuestion,
  Source,
} from "@/src/types";
import {
  MessageItemType,
  TASK_STATUS,
  TASK_TYPE,
  ConversationOperation,
} from "@/src/types";
import type { Task } from "@/src/types";
import {
  buildIntentMessageList,
  buildQuestionMessage,
  buildReplyMessage,
} from "@/src/utils/message";

import { buildErrorMessage } from "@/src/utils/message";
import { scrollToBottom } from "@/src/utils/ui";
import { safeParseJSON } from "@/src/utils/parse";
import { SearchTarget, useSearchStateStore } from "@/src/stores/search-state";
import { useWeblinkStore } from "@/src/stores/weblink";
import { getPort, removePort } from "@/src/utils/extension-message";
import { Runtime } from "wxt/browser";

export const useBuildTask = () => {
  const genResponsePortRef = useRef<Runtime.Port>();

  const quickActionStore = useQuickActionStore();
  const popupStore = usePopupStore();
  const chatStore = useChatStore();
  const messageStateStore = useMessageStateStore();
  const conversationStore = useConversationStore();

  const buildShutdownTaskAndGenResponse = () => {
    handleSendMessageWithPorts({
      body: {
        type: TASK_STATUS.SHUTDOWN,
      },
    });
  };

  const buildTaskAndGenReponse = (task: Task) => {
    console.log("buildTaskAndGenReponse", task);
    const question = task.data?.question;

    // 构建 filter, for follow ask question config
    const weblinkList = task?.data?.filter?.weblinkList || [];
    const selectedWeblinkConfig = {
      searchTarget: weblinkList?.length > 0 ? "selectedPages" : "all",
      filter: weblinkList,
    };
    const questionMsg = buildQuestionMessage({
      convId: conversationStore.currentConversation?.convId,
      content: question,
      selectedWeblinkConfig: JSON.stringify(selectedWeblinkConfig),
    });

    const replyMsg = buildReplyMessage({
      convId: conversationStore.currentConversation?.convId,
      content: "",
      questionId: questionMsg?.itemId,
    });

    // 将 reply 加到 message-state
    messageStateStore.setMessageState({
      pendingReplyMsg: replyMsg,
      taskType: task?.taskType,
    });

    chatStore.setMessages(chatStore.messages.concat(questionMsg));
    scrollToBottom();

    handleGenResponse(task);
  };

  const handleGenResponse = useCallback(
    (task: Task) => {
      // 发起一个 gen 请求，开始接收
      messageStateStore.setMessageState({
        pending: true,
        pendingFirstToken: true,
        taskType: task?.taskType,
        pendingMsg: "",
        error: false,
      });

      // 直接发送 task
      handleSendMessageWithPorts({
        body: {
          type: TASK_STATUS.START,
          payload: task,
        },
      });
    },
    [conversationStore.currentConversation?.convId]
  );

  const onError = (status: number) => {
    const currentChatState = useChatStore.getState();
    console.log("status", status);

    const newMessageState: Partial<MessageState> = {
      pending: false,
      error: false,
    };

    // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
    const errMsg = buildErrorMessage({
      convId: conversationStore.currentConversation?.convId,
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

  const onContent = (content: string) => {
    const currentMessageState = useMessageStateStore.getState();
    const currentChatState = useChatStore.getState();

    // 没有消息时，先创建
    const lastMessage = currentChatState.messages.at(-1) as Message;
    const savedMessage = currentChatState.messages.slice(0, -1) as Message[];

    lastMessage.data.content = content;
    chatStore.setMessages([...savedMessage, { ...lastMessage }]);
    messageStateStore.setMessageState({
      pendingMsg: content,
    });
  };

  const onSources = (sources: Source[]) => {
    const currentMessageState = useMessageStateStore.getState();
    const currentChatState = useChatStore.getState();

    let lastMessage, savedMessage;
    if (currentMessageState.pendingFirstToken) {
      lastMessage = currentMessageState.pendingReplyMsg as Message;
      savedMessage = currentChatState.messages as Message[];

      lastMessage.data.content = "";
      messageStateStore.setMessageState({
        pendingFirstToken: false,
        pending: true,
      });
    } else {
      lastMessage = currentChatState.messages.at(-1) as Message;
      savedMessage = currentChatState.messages.slice(0, -1) as Message[];
    }

    console.log("sourceWeblinkPayload", sources);
    messageStateStore.setMessageState({
      ...currentMessageState,
      pendingSourceDocs: (currentMessageState.pendingSourceDocs || [])
        ?.concat(sources)
        ?.filter((item) => item),
    });

    console.log("sourceWeblinkPayload", currentChatState.messages);

    if (Array.isArray(lastMessage?.data?.sources)) {
      lastMessage.data.sources = lastMessage?.data?.sources
        ?.concat(sources || [])
        ?.filter((item) => item);
    } else {
      lastMessage.data.sources = [...sources]?.filter((item) => item);
    }
    chatStore.setMessages([...savedMessage, { ...lastMessage }]);

    // 更新消息之后滚动到底部
    setTimeout(() => {
      scrollToBottom();
    }, 1000);
  };

  const onRelated = (related: RelatedQuestion[]) => {
    const currentMessageState = useMessageStateStore.getState();
    const currentChatState = useChatStore.getState();

    console.log("related question", related);
    messageStateStore.setMessageState({
      ...currentMessageState,
      pending: false,
      pendingRelatedQuestions: (
        currentMessageState.pendingRelatedQuestions || []
      )
        ?.concat(related)
        ?.filter((item) => item),
    });

    const lastMessage = currentChatState.messages.at(-1) as Message;
    const savedMessage = currentChatState.messages.slice(0, -1) as Message[];

    console.log("latest related question", lastMessage?.data.relatedQuestions);

    if (Array.isArray(lastMessage?.data?.relatedQuestions)) {
      lastMessage.data.relatedQuestions = lastMessage?.data?.relatedQuestions
        ?.concat(related || [])
        ?.filter((item) => item);
    } else {
      lastMessage.data.relatedQuestions = [...related]?.filter((item) => item);
    }
    chatStore.setMessages([...savedMessage, { ...lastMessage }]);
  };

  const handleStreamingMessage = (msg: { type: string; message: any }) => {
    console.log("handleStreamingMessage", msg);
    switch (msg?.type) {
      case "source":
        return onSources(safeParseJSON(msg?.message));
      case "content":
        return onContent(msg?.message);
      case "relatedQuestions":
        return onRelated(safeParseJSON(msg?.message));
      case "error":
        return onError(msg?.message);
    }
  };

  const bindExtensionPorts = () => {
    console.log("bindExtensionPorts");
    if (genResponsePortRef.current) return;
    console.log("alreadybindExtensionPorts");

    genResponsePortRef.current = getPort("gen-response" as never);
    genResponsePortRef.current?.onMessage.addListener(handleStreamingMessage);
  };

  const unbindExtensionPorts = () => {
    console.log("unbindExtensionPorts");
    if (genResponsePortRef?.current) return;

    genResponsePortRef.current?.onMessage?.removeListener?.(
      handleStreamingMessage
    );
    removePort?.("gen-response" as never);
  };

  const handleSendMessageWithPorts = (payload: { body: any }) => {
    // 先 unbind
    unbindExtensionPorts();
    // 再 bind
    bindExtensionPorts();

    // 生成任务
    genResponsePortRef.current?.postMessage(payload);
  };

  return {
    buildTaskAndGenReponse,
    buildShutdownTaskAndGenResponse,
  };
};
