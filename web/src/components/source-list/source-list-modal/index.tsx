import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
import { Drawer } from "@arco-design/web-react"
import { useTranslation } from "react-i18next"
// 样式
import "./index.scss"

// 自定义组件
import { ResourceList } from "@/components/resource-list"
import { useBuildThreadAndRun } from "@/hooks/use-build-thread-and-run"
import { ResourceDetail } from "@/types"

interface SourceListModalProps {
  getPopupContainer: () => Element
  title: string
  classNames: string
  width?: number
  height?: string
  placement?: "bottom" | "left" | "right" | "top"
  resources: Partial<ResourceDetail>[]
}

export const SourceListModal = (props: SourceListModalProps) => {
  const { t } = useTranslation()
  const knowledgeBaseStore = useKnowledgeBaseStore()
  const { jumpNewKnowledgeBase } = useBuildThreadAndRun()

  const getPopupContainer = () => {
    if (props?.getPopupContainer) {
      return props.getPopupContainer()
    }

    return document.body
  }

  return (
    <Drawer
      width={props.width || "100%"}
      style={{
        zIndex: 66,
        background: "#FCFCF9",
        height: props.height || "66%",
      }}
      getPopupContainer={getPopupContainer}
      headerStyle={{ justifyContent: "center" }}
      title={
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ fontWeight: "bold" }}>{props.title || ""}</span>
        </div>
      }
      visible={knowledgeBaseStore.sourceListModalVisible}
      placement={props.placement || "bottom"}
      footer={null}
      onOk={() => {
        knowledgeBaseStore.updateSourceListModalVisible(false)
      }}
      onCancel={() => {
        knowledgeBaseStore.updateSourceListModalVisible(false)
      }}>
      <ResourceList
        placeholder="搜索来源..."
        resources={props.resources}
        showUtil={false}
        searchKey="description"
        btnProps={{ defaultActiveKeys: [] }}
        showBtn={{ summary: false, markdown: true, externalOrigin: true }}
        classNames={props.classNames}
        handleItemClick={item => {
          //   jumpNewKnowledgeBase(kbId)
          //   knowledgeBaseStore.updateKbModalVisible(false)
        }}
      />
    </Drawer>
  )
}
