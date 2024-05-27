import { useUserStore } from "@/stores/user"
import { cnGuessQuestions, enGuessQuestions } from "@/utils/guess-question"
import {
  Avatar,
  Breadcrumb,
  Button,
  Typography,
  Message as message,
  Tabs,
} from "@arco-design/web-react"
import { useTranslation } from "react-i18next"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"

// 自定义组件
import { KnowledgeBaseDirectory } from "../directory"
import { KnowledgeBaseResourceDetail } from "../resource-detail"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCaretDown,
  IconDown,
  IconDownCircle,
  IconFolder,
  IconLeft,
  IconRight,
} from "@arco-design/web-react/icon"
// 样式
import "./index.scss"
import { useResizePanel } from "@/hooks/use-resize-panel"
import { ActionSource, useKnowledgeBaseStore } from "@/stores/knowledge-base"
import { KnowledgeBaseListModal } from "../copilot/knowledge-base-list-modal"
import { useState } from "react"

const BreadcrumbItem = Breadcrumb.Item
const TabPane = Tabs.TabPane

let count = 5

export const KnowledgeBaseDetail = () => {
  // directory minSize 270px ~ maxSize 50%
  const [minSize] = useResizePanel({
    groupSelector: "knowledge-base-detail-panel-container",
    resizeSelector: "knowledge-base-detail-panel-resize",
    initialMinSize: 24,
    initialMinPixelSize: 270,
  })

  const knowledgeBaseStore = useKnowledgeBaseStore()
  console.log("knowledgeBaseStore", knowledgeBaseStore.actionSource)

  const initTabs = [...new Array(count)].map((x, i) => ({
    title: `Tab ${i + 1}`,
    key: `key${i + 1}`,
    content: `${i + 1}`,
  }))
  const [tabs, setTabs] = useState(initTabs)
  const [activeTab, setActiveTab] = useState("key2")

  const handleAddTab = () => {
    const newTab = {
      title: `New Tab${++count}`,
      key: `new key${count}`,
      content: `${count}`,
    }
    setTabs([...tabs, newTab])
    setActiveTab(newTab.key)
  }

  const handleDeleteTab = key => {
    const index = tabs.findIndex(x => x.key === key)
    const newTabs = tabs.slice(0, index).concat(tabs.slice(index + 1))

    if (key === activeTab && index > -1 && newTabs.length) {
      setActiveTab(newTabs[index] ? newTabs[index].key : newTabs[index - 1].key)
    }

    if (index > -1) {
      setTabs(newTabs)
    }
  }

  return (
    <div className="knowledge-base-detail-container">
      {/* <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <Breadcrumb>
            <BreadcrumbItem href="/">工作台</BreadcrumbItem>
            <BreadcrumbItem
              href={`/knowledge-base/`}
              className="breadcrum-description">
              知识库
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="knowledge-base-detail-nav-switcher">
          <Button
            icon={<IconFolder />}
            type="text"
            onClick={() => {
              knowledgeBaseStore.updateActionSource(ActionSource.KnowledgeBase)
              knowledgeBaseStore.updateKbModalVisible(true)
            }}
            className="chat-input-assist-action-item">
            <p className="assist-action-title">
              {knowledgeBaseStore?.currentKnowledgeBase?.title || "选择知识库"}
            </p>
            <IconCaretDown />
          </Button>
        </div>
        <div className="knowledge-base-detail-menu">
          <Button
            type="text"
            icon={<IconMore style={{ fontSize: 16 }} />}></Button>
        </div>
      </div> */}
      <Tabs
        editable
        className="knowledge-base-detail-tab-container"
        type="card-gutter"
        activeTab={activeTab}
        onAddTab={handleAddTab}
        onDeleteTab={handleDeleteTab}
        onChange={setActiveTab}
        renderTabHeader={(props, DefaultTabHeader) => {
          return (
            <div className="knowledge-base-detail-header">
              <div className="knowledge-base-detail-navigation-bar">
                <Button icon={<IconArrowLeft />} type="text"></Button>
                <Button icon={<IconArrowRight />} type="text"></Button>
              </div>
              <div className="knowledge-base-detail-nav-switcher">
                <DefaultTabHeader {...props} />
              </div>
            </div>
          )
        }}>
        {tabs.map((x, i) => (
          <TabPane destroyOnHide key={x.key} title={x.title}>
            <PanelGroup
              direction="horizontal"
              className="knowledge-base-detail-panel-container">
              <Panel
                defaultSize={minSize}
                minSize={minSize}
                maxSize={50}
                className="knowledge-base-detail-directory-panel">
                <KnowledgeBaseDirectory />
              </Panel>
              <PanelResizeHandle className="knowledge-base-detail-panel-resize" />
              <Panel
                className="knowledge-base-detail-resource-panel"
                minSize={50}>
                <KnowledgeBaseResourceDetail />
              </Panel>
            </PanelGroup>
          </TabPane>
        ))}
      </Tabs>
      {knowledgeBaseStore?.kbModalVisible &&
      knowledgeBaseStore.actionSource === ActionSource.KnowledgeBase ? (
        <KnowledgeBaseListModal
          title="知识库"
          classNames="kb-list-modal"
          placement="right"
          width={360}
          height="100%"
          getPopupContainer={() => {
            const elem = document.querySelector(
              ".knowledge-base-detail-container",
            ) as Element

            console.log("getPopupContainer knowledge", elem)

            return elem
          }}
        />
      ) : null}
    </div>
  )
}
