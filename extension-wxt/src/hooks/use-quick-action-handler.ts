import { useWeblinkStore } from "@/src/stores/weblink";
import { mapSourceFromWeblinkList } from "@/src/utils/weblink";
import { useBuildThreadAndRun } from "@/src/hooks/use-build-thread-and-run";
import { SearchTarget, useSearchStateStore } from "@/src/stores/search-state";
import { useSearchQuickActionStore } from "@/src/stores/search-quick-action";
import { useContentSelectorStore } from "@/src/stores/content-selector";
import { useStoreWeblink } from "@/src/hooks/use-store-weblink";
import type { Source } from "@/src/types";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/src/stores/chat";
import { QUICK_ACTION_TYPE, type QUICK_ACTION_TASK_PAYLOAD } from "@/src/types";
import { useUserStore } from "@/src/stores/user";
import { buildQuickActionTask } from "@/src/utils/task";
import { buildConversation } from "@/src/utils/conversation";
import { useBuildTask } from "./use-build-task";
import { useKnowledgeBaseStore } from "@/src/stores/knowledge-base";

export const useQuickActionHandler = () => {
  const chatStore = useChatStore();
  const { uploadingStatus, handleUploadWebsite } = useStoreWeblink();
  const { searchTarget } = useSearchStateStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { buildTaskAndGenReponse } = useBuildTask();
  const { runQuickActionTask } = useBuildThreadAndRun();
  const { t } = useTranslation();

  const dryRunSummarize = async (payload: QUICK_ACTION_TASK_PAYLOAD) => {
    const { localSettings } = useUserStore.getState();

    // 需要
    const task = buildQuickActionTask(
      {
        question: t("components.currentWeblinkQuickSummary.message.question"),
        actionType: QUICK_ACTION_TYPE.SUMMARY,
        filter: payload?.filter,
        actionPrompt: t("hooks.useBuildThreadAndRun.task.summary.actionPrompt"),
      },
      localSettings.outputLocale,
      true
    );

    const nowConversation = buildConversation();
    task.data = {
      ...(task?.data || {}),
      convId: nowConversation?.convId,
    };

    buildTaskAndGenReponse(task);
  };

  /**
   * 1. quickAction 单个网页或多个网页都统一应用规则
   * 2. 也只有这两种情况下需要
   */
  const summarize = async () => {
    chatStore.setLoading(true);

    console.log("handleSummary");
    if (uploadingStatus === "loading") return;

    const { searchTarget } = useSearchStateStore.getState();
    const { marks } = useContentSelectorStore.getState();

    let filter = {};

    // check 网页状态
    if (searchTarget === SearchTarget.CurrentPage) {
      const res = await handleUploadWebsite(window.location.href);

      if (!res?.success) {
        return;
      }
    }

    // TODO: 增加 xPath
    if (searchTarget === SearchTarget.CurrentPage) {
      // 1）单个网页的时候 2）单个网页中部分内容，都需要先上传
      // 然后服务端只取 html + xpath 做处理，以及下次重新访问会话时展示 filter 也是用 html + xpath 获取内容展示

      filter = {
        weblinkList: [
          {
            pageContent: "",
            metadata: {
              title: document?.title || "",
              source: location.href,
            },
            score: -1,
            selections: marks?.map((item) => ({
              type: "text",
              xPath: item?.xPath,
              content: item?.data,
            })),
          } as Source,
        ],
      };
    } else if (searchTarget === SearchTarget.SelectedPages) {
      const { selectedRow } = useWeblinkStore.getState();
      const weblinkList = mapSourceFromWeblinkList(selectedRow);
      filter = {
        weblinkList,
      };
    }

    runQuickActionTask({
      filter,
    });
  };

  const translate = async () => {};

  const explain = async () => {};

  const storeForLater = async () => {
    knowledgeBaseStore.updateIsSaveKnowledgeBaseModalVisible(true);
    // if (searchTarget === SearchTarget.CurrentPage) {
    //   const res = await handleUploadWebsite(window.location.href, true)

    //   if (!res?.success) {
    //     return
    //   }
    // }
  };

  return {
    summarize,
    translate,
    explain,
    storeForLater,
    dryRunSummarize,
  };
};
