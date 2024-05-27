export const getQuickActionPrompt = (promptKey: string) => {
  switch (promptKey) {
    case "explain": {
      return {
        prompt: "解释该文本并定义任何技术术语。",
        key: "explain",
        title: "解释说明",
      }
    }

    case "translate": {
      return {
        prompt: "根据上下文提供最佳翻译",
        key: "translate",
        title: "翻译",
      }
    }
  }
}
