import { useState, useEffect } from "react"
import { Divider, Modal, Input, Button, Affix } from "@arco-design/web-react"
import { CgFileDocument } from "react-icons/cg"

import { useNewCanvasModalStoreShallow } from "@refly-packages/ai-workspace-common/stores/new-canvas-modal"
import { useAINote } from "@refly-packages/ai-workspace-common/hooks/use-ai-note"

// utils
import { SearchSelect } from "@refly-packages/ai-workspace-common/modules/entity-selector/components"
import { useTranslation } from "react-i18next"

// 样式
import "./index.scss"
import { getPopupContainer } from "@refly-packages/ai-workspace-common/utils/ui"
import { useProjectStoreShallow } from "@refly-packages/ai-workspace-common/stores/project"

const { TextArea } = Input

export const NewCanvasModal = () => {
  const { t } = useTranslation()
  const [saveLoading, setSaveLoading] = useState(false)
  const newCanvasModalStore = useNewCanvasModalStoreShallow(state => ({
    newCanvasModalVisible: state.newCanvasModalVisible,
    title: state.title,
    content: state.content,
    selectedProjectId: state.selectedProjectId,
    setNewCanvasModalVisible: state.setNewCanvasModalVisible,
    setTitle: state.setTitle,
    setContent: state.setContent,
    setSelectedProjectId: state.setSelectedProjectId,
  }))
  const { fetchProjectDirItems } = useProjectStoreShallow(state => ({
    fetchProjectDirItems: state.fetchProjectDirItems,
  }))

  const { handleInitEmptyNote } = useAINote()

  const handleSave = async () => {
    setSaveLoading(true)

    try {
      await handleInitEmptyNote({
        title: newCanvasModalStore.title,
        projectId: newCanvasModalStore.selectedProjectId,
        content: newCanvasModalStore.content,
      })

      fetchProjectDirItems(newCanvasModalStore.selectedProjectId, "canvases")

      newCanvasModalStore.setNewCanvasModalVisible(false)
    } catch (error) {
      console.error(error)
    } finally {
      setSaveLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      console.log("reset")
      newCanvasModalStore.setSelectedProjectId("")
      newCanvasModalStore.setTitle("")
      newCanvasModalStore.setContent("")
    }
  }, [newCanvasModalStore.newCanvasModalVisible])

  return (
    <Modal
      unmountOnExit
      visible={newCanvasModalStore.newCanvasModalVisible}
      footer={null}
      onCancel={() => {
        newCanvasModalStore.setNewCanvasModalVisible(false)
      }}
      getPopupContainer={getPopupContainer}
      className="new-canvas-modal"
      style={{
        height: "70%",
        minHeight: 500,
        maxHeight: 700,
        width: "55%",
        minWidth: "400px",
        maxWidth: "950px",
      }}>
      <div className="new-canvas-container">
        <div className="new-canvas-right-panel">
          <div className="intergation-container intergation-import-from-weblink">
            <div className="intergation-content">
              <div className="intergration-header">
                <span className="menu-item-icon">
                  <CgFileDocument style={{ color: "#297AFF" }} />
                </span>
                <span className="intergration-header-title">
                  {t("canvas.newCanvas.modalTitle")}
                </span>
              </div>

              <Divider />

              <div className="intergation-body">
                <Input
                  style={{ marginBottom: 16 }}
                  placeholder={t("canvas.newCanvas.titlePlaceholder")}
                  maxLength={100}
                  showWordLimit
                  value={newCanvasModalStore.title}
                  onChange={value => newCanvasModalStore.setTitle(value)}
                />

                <TextArea
                  placeholder={t("canvas.newCanvas.descriptionPlaceholder")}
                  rows={4}
                  autoSize={{
                    minRows: 4,
                    maxRows: 4,
                  }}
                  value={newCanvasModalStore.content}
                  onChange={value => newCanvasModalStore.setContent(value)}
                />
              </div>
            </div>

            <Affix
              offsetBottom={0}
              target={() =>
                document.querySelector(".new-canvas-right-panel") as HTMLElement
              }>
              <div className="intergation-footer">
                <div className="footer-location">
                  <div className="save-container">
                    <p className="text-item save-text-item">
                      {t("resource.import.saveTo")}
                    </p>
                    <SearchSelect
                      domain="project"
                      className="kg-selector"
                      allowCreateNewEntity
                      {...(newCanvasModalStore.selectedProjectId && {
                        defaultValue: newCanvasModalStore.selectedProjectId,
                      })}
                      onChange={value => {
                        if (!value) return
                        newCanvasModalStore.setSelectedProjectId(value)
                      }}
                    />
                  </div>
                </div>
                <div className="footer-action">
                  <Button
                    style={{ marginRight: 8 }}
                    onClick={() =>
                      newCanvasModalStore.setNewCanvasModalVisible(false)
                    }>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSave}
                    disabled={!newCanvasModalStore.title}
                    loading={saveLoading}>
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            </Affix>
          </div>
        </div>
      </div>
    </Modal>
  )
}
