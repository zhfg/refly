import AbstractSVG from "~assets/menu-icons/abstract.svg"
import CodeSVG from "~assets/menu-icons/code.svg"
import ExplainSVG from "~assets/menu-icons/explain.svg"
import ExtensionSVG from "~assets/menu-icons/extension.svg"
import GrammarySVG from "~assets/menu-icons/grammary.svg"
import QASVG from "~assets/menu-icons/qa.svg"
import TranslateSVG from "~assets/menu-icons/translate.svg"
import WriteSVG from "~assets/menu-icons/write.svg"

export const modeList = [
    {
      id: "3",
      icon: ExplainSVG,
      text: "解释",
      prompt: `解释这个文本并说明其中使用的任何技术术语。`
    },
    {
      id: "6",
      icon: TranslateSVG,
      text: "翻译",
      prompt: `将这段文字翻译成中文。`
    },
    {
      id: "4",
      icon: AbstractSVG,
      text: "摘要",
      prompt: `用原文语言概括这段文字。`
    },
    {
      id: "8",
      icon: CodeSVG,
      text: "解释代码",
      prompt: `解释以下代码：
        \`\`\`
        $[text]
        \`\`\``
    },
    {
      id: "2",
      icon: WriteSVG,
      text: "重写",
      prompt: `重新表述这段文字。`
    },
    {
      id: "1",
      icon: QASVG,
      text: "问答",
      prompt: `回答这个问题。`
    },
    {
      id: "5",
      icon: GrammarySVG,
      text: "语法",
      prompt: `校对并纠正这段文字。`
    },
  
    {
      id: "7",
      icon: ExtensionSVG,
      text: "扩写",
      prompt: `详细说明这段文字。`
    }
  ]
  
  const markdown = `
    
    
    # Refly
    
    [Refly](https://refly.ai)
    
    - Refly
    - fly
    
    Refly must fly!
    
    \`\`\`js
    const foo = 42
    \`\`\`
    
    `
  const getModePrompt = (modeId: string) => {
    return modeList.filter((item) => (item.id = modeId))?.[0]?.prompt
  }
  