import type { Source } from "@/types"

export const buildSource = (): Source => {
  return {
    pageContent: "",
    metadata: {
      title: "",
      source: "",
    },
    score: -1,
  }
}
