import { useParams } from "react-router-dom"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Canvas } from "@refly-packages/ai-workspace-common/components/canvas"
import { Button, Empty } from "antd"
import { useTranslation } from "react-i18next"
import { IconPlus } from "@refly-packages/ai-workspace-common/components/common/icon"
import { useCreateCanvas } from "@refly-packages/ai-workspace-common/hooks/use-create-canvas"
import { useSiderStoreShallow } from "@refly-packages/ai-workspace-common/stores/sider"

const CanvasPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { canvasId = "" } = useParams()
  const { debouncedCreateCanvas, isCreating } = useCreateCanvas()
  const { canvasList = [] } = useSiderStoreShallow(state => ({
    canvasList: state.canvasList ?? [],
  }))

  useEffect(() => {
    // Store canvasId in localStorage if it exists
    if (canvasId && canvasId !== "empty") {
      localStorage.setItem("currentCanvasId", canvasId)
    } else if (canvasId === "empty") {
      if (canvasList.length > 0) {
        navigate(`/canvas/${canvasList[0].id}`, { replace: true })
        localStorage.setItem("currentCanvasId", canvasList[0].id)
      } else {
        localStorage.removeItem("currentCanvasId")
      }
    }
  }, [canvasId, canvasList, navigate])

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
