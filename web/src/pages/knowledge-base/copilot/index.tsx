import { Tabs, Input } from "@arco-design/web-react"
import { Breadcrumb, Button } from "@arco-design/web-react"

// 自定义组件
import { DigestToday } from "@/pages/digest-today"
import { ThreadLibrary } from "@/components/thread-library"

// 自定义组件
import {
  IconApps,
  IconCaretDown,
  IconDown,
  IconFolder,
  IconMessage,
  IconMore,
  IconRobot,
  IconTranslate,
} from "@arco-design/web-react/icon"
// 自定义样式
import "./index.scss"
import { fakeConversations } from "@/fake-data/thread"
import { MessageType } from "@/types"
import { AssistantMessage, HumanMessage } from "./message"

const TextArea = Input.TextArea

export const AICopilot = () => {
  const conv = fakeConversations?.[0]

  return (
    <div className="ai-copilot-container">
      <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <div className="conv-meta">
            <IconMessage style={{ color: "rgba(0, 0, 0, .6)" }} />
            <p className="conv-title">elmo chat 和 devv 比较如何？</p>
          </div>
        </div>
        <div className="knowledge-base-detail-menu">
          <Button
            type="text"
            icon={<IconMore style={{ fontSize: 16 }} />}></Button>
        </div>
      </div>
      <div className="ai-copilot-message-container">
        {conv?.messages?.map((item, index) =>
          item.type === MessageType.Human ? (
            <HumanMessage message={item} key={index} />
          ) : (
            <AssistantMessage message={item} key={index} />
          ),
        )}
      </div>
      <div className="ai-copilot-body">
        <div className="ai-copilot-chat-container">
          <div className="skill-container">
            {["搜索", "写作", "翻译", "数据分析", "更多技能"].map(
              (item, index) => (
                <div key={index} className="skill-item">
                  {item}
                </div>
              ),
            )}
          </div>
          <div className="chat-input-container">
            <div className="chat-input-body">
              <TextArea
                placeholder="提出问题，发现新知"
                autoSize={{ minRows: 3, maxRows: 4 }}
              />
            </div>
            <div className="chat-input-assist-action">
              <Button
                icon={<IconTranslate />}
                type="text"
                className="chat-input-assist-action-item">
                <span>简体中文</span>
                <IconCaretDown />
              </Button>
              <Button
                icon={<IconApps />}
                type="text"
                className="chat-input-assist-action-item">
                <span>总结会话</span>
                <IconCaretDown />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
