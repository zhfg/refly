import { useState } from "react"
import { Divider, Modal, Input, Button, Affix } from "@arco-design/web-react"
import { HiLink } from "react-icons/hi"
import { useNewCanvasModalStore } from "@/store/new-canvas-modal"

// utils
import { SearchSelect } from "@refly-packages/ai-workspace-common/modules/entity-selector/components"
import { useTranslation } from "react-i18next"

// 样式
import "./index.scss"
import { getPopupContainer } from "@refly-packages/ai-workspace-common/utils/ui"

const { TextArea } = Input

export const NewCanvasModal = () => {
  const { t } = useTranslation()
  const [saveLoading, setSaveLoading] = useState(false)
  const newCanvasModalStore = useNewCanvasModalStore(state => ({
    newCanvasModalVisible: state.newCanvasModalVisible,
    setNewCanvasModalVisible: state.setNewCanvasModalVisible,
    selectedCollectionId: state.selectedCollectionId,
    setSelectedCollectionId: state.setSelectedCollectionId,
    title: state.title,
    description: state.description,
    setTitle: state.setTitle,
    setDescription: state.setDescription,
  }))

  const handleSave = async () => {
    setSaveLoading(true)

    // logic to be implemented

    setSaveLoading(false)
  }

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
        width: "60%",
        minWidth: "300px",
        maxWidth: "950px",
      }}>
      <div className="new-canvas-container">
        <div className="new-canvas-right-panel">
          <div className="intergation-container intergation-import-from-weblink">
            <div className="intergation-content">
              <div className="intergation-operation-container">
                <div className="intergration-header">
                  <span className="menu-item-icon">
                    <HiLink />
                  </span>
                  <span className="intergration-header-title">
                    {t("canvas.newCanvas.modalTitle")}
                  </span>
                </div>
                <Divider />
                <div className="intergation-body">
                  <div className="intergation-body-action">
                    <TextArea
                      placeholder={t("canvas.newCanvas.titlePlaceholder")}
                      rows={4}
                      autoSize={{
                        minRows: 4,
                        maxRows: 4,
                      }}
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
                      value={newCanvasModalStore.description}
                      onChange={value =>
                        newCanvasModalStore.setDescription(value)
                      }
                    />
                  </div>
                  <div className="intergation-body-result"></div>
                </div>
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
                      domain="collection"
                      className="kg-selector"
                      allowCreateNewEntity
                      onChange={value => {
                        if (!value) return
                        newCanvasModalStore.setSelectedCollectionId(value)
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
