import { useParams } from "react-router-dom"
import { Canvas } from "@refly-packages/ai-workspace-common/components/canvas"

const CanvasPage = () => {
  const { canvasId = "" } = useParams()

  return <Canvas canvasId={canvasId} />
}

export default CanvasPage
