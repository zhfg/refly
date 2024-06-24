import mitt from "mitt"

type Events = {
  activeAskAI: boolean
}

export type EditorOperation = "activeAskAI"

export const editorEmitter = mitt<Events>()
