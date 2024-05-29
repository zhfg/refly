import { Tabs, Input } from "@arco-design/web-react";
import { Breadcrumb, Button } from "@arco-design/web-react";

// 自定义组件
import {
  IconApps,
  IconArchive,
  IconBook,
  IconCaretDown,
  IconDown,
  IconFolder,
  IconHistory,
  IconMessage,
  IconMore,
  IconPlusCircle,
  IconRobot,
  IconTranslate,
} from "@arco-design/web-react/icon";
// 自定义样式
import "./index.scss";
import { MessageType } from "@/src/types";
import { AssistantMessage, HumanMessage } from "./message";
import { ChatHeader } from "@/src/components/home/header";
import { fakeConversations } from "@/src/fake-data/conversation";
import { ContentSelectorBtn } from "@/src/components/content-selector-btn";
import { SearchTarget, useSearchStateStore } from "@/src/stores/search-state";
// styles
import "./index.scss";

const TextArea = Input.TextArea;

export const AICopilot = () => {
  const messages = fakeConversations?.[0]?.messages;
  const searchStateStore = useSearchStateStore();

  return (
    <div className="ai-copilot-container">
      <ChatHeader />
      <div className="ai-copilot-message-container">
        {messages?.map((item, index) =>
          item.type === MessageType.Human ? (
            <HumanMessage message={item} key={index} />
          ) : (
            <AssistantMessage message={item} key={index} />
          )
        )}
      </div>
      <div className="ai-copilot-body">
        <div className="ai-copilot-chat-container">
          <div className="chat-setting-container">
            <div className="chat-operation-container">
              <Button
                icon={<IconBook />}
                type="text"
                className="chat-input-assist-action-item"
              >
                快速总结
              </Button>
            </div>
            <div className="conv-operation-container">
              <Button
                icon={<IconHistory />}
                type="text"
                className="chat-input-assist-action-item"
              >
                会话历史
              </Button>
              <Button
                icon={<IconPlusCircle />}
                type="text"
                className="chat-input-assist-action-item"
              >
                新会话
              </Button>
            </div>
          </div>
          <div className="skill-container">
            {["搜索", "写作", "翻译", "数据分析", "更多技能"].map(
              (item, index) => (
                <div key={index} className="skill-item">
                  {item}
                </div>
              )
            )}
          </div>
          <div className="chat-input-container">
            <div className="chat-input-body">
              <TextArea
                placeholder="提出问题，发现新知"
                autoSize={{ minRows: 2, maxRows: 2 }}
              />
            </div>
            <div className="chat-input-assist-action">
              <Button
                icon={<IconTranslate />}
                type="text"
                className="chat-input-assist-action-item"
              >
                <span>简体中文</span>
                <IconCaretDown />
              </Button>
              <Button
                icon={<IconApps />}
                type="text"
                className="chat-input-assist-action-item"
              >
                <span>总结会话</span>
                <IconCaretDown />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
