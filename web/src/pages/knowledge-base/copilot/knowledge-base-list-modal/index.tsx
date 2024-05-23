import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
import { Drawer } from "@arco-design/web-react"
import { useTranslation } from "react-i18next"
// 样式
import "./index.scss"

// 自定义组件
import { KnowledgeBaseList } from "@/components/knowledge-base-list"
import { useNavigate } from "react-router-dom"
import { useBuildThreadAndRun } from "@/hooks/use-build-thread-and-run"

interface KnowledgeBaseListModalProps {
  getPopupContainer: () => Element
  title: string
  classNames: string
}

export const KnowledgeBaseListModal = (props: KnowledgeBaseListModalProps) => {
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
    <div style={{ width: "100%" }} className="conv-list-modal-container">
      <Drawer
        width="100%"
        style={{
          zIndex: 66,
          height: "66%",
          background: "#FCFCF9",
        }}
        getPopupContainer={getPopupContainer}
        headerStyle={{ justifyContent: "center" }}
        title={
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ fontWeight: "bold" }}>{props.title || ""}</span>
          </div>
        }
        visible={knowledgeBaseStore.kbModalVisible}
        placement="bottom"
        footer={null}
        onOk={() => {
          knowledgeBaseStore.updateKbModalVisible(false)
        }}
        onCancel={() => {
          knowledgeBaseStore.updateKbModalVisible(false)
        }}>
        <KnowledgeBaseList
          classNames={props.classNames}
          handleItemClick={kbId => {
            jumpNewKnowledgeBase(kbId)
            knowledgeBaseStore.updateKbModalVisible(false)
          }}
        />
      </Drawer>
    </div>
  )
}
