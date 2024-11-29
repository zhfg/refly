import { useParams } from "react-router-dom"
import { useEffect } from "react"
import { Canvas } from "@refly-packages/ai-workspace-common/components/canvas"
import { Button, Empty } from "antd"
import { useTranslation } from "react-i18next"
import { IconPlus } from "@refly-packages/ai-workspace-common/components/common/icon"
import { useCreateCanvas } from "@refly-packages/ai-workspace-common/hooks/use-create-canvas"

const CanvasPage = () => {
  const { t } = useTranslation()
  const { canvasId = "" } = useParams()
  const { debouncedCreateCanvas, isCreating } = useCreateCanvas()

  useEffect(() => {
    // Store canvasId in localStorage if it exists
    if (canvasId && canvasId !== "empty") {
      localStorage.setItem("currentCanvasId", canvasId)
    }
  }, [canvasId])

  return canvasId && canvasId !== "empty" ? (
    <Canvas canvasId={canvasId} />
  ) : (
    <Empty
      className="flex h-full w-full flex-col items-center justify-center"
      description={t("common.empty")}>
      <Button
        type="primary"
        onClick={debouncedCreateCanvas}
        loading={isCreating}
        icon={<IconPlus />}>
        {t("loggedHomePage.siderMenu.newCanvas")}
      </Button>
    </Empty>
  )
}

export default CanvasPage
