import { useParams } from "react-router-dom"
import { useEffect } from "react"
import { Canvas } from "@refly-packages/ai-workspace-common/components/canvas"

const CanvasPage = () => {
  const { canvasId = "" } = useParams()

  useEffect(() => {
    // Store canvasId in localStorage if it exists
    if (canvasId) {
      localStorage.setItem("currentCanvasId", canvasId)
    }
  }, [canvasId])

  return <Canvas canvasId={canvasId} />
}

export default CanvasPage
