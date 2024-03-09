import { IconLoading } from "@arco-design/web-react/icon"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import "katex/dist/katex.min.css"

import copyToClipboard from "copy-to-clipboard"
import RehypeHighlight from "rehype-highlight"
import RehypeKatex from "rehype-katex"
import RemarkBreaks from "remark-breaks"
import RemarkGfm from "remark-gfm"
import RemarkMath from "remark-math"

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null)

  return (
    <pre ref={ref}>
      <span
        className="copy-code-button"
        onClick={() => {
          if (ref.current) {
            const code = ref.current.innerText
            copyToClipboard(code)
          }
        }}></span>
      {props.children}
    </pre>
  )
}

export function Markdown(
  props: {
    content: string
    loading?: boolean
    fontSize?: number
  } & React.DOMAttributes<HTMLDivElement>
) {
  const mdRef = useRef<HTMLDivElement>(null)

  const md = mdRef.current
  const rendered = useRef(true) // disable lazy loading for bad ux
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    // to triggr rerender
    setCounter(counter + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loading])

  const shouldLoading = props.loading

  return (
    <div
      className="markdown-body"
      style={{ fontSize: `${props.fontSize ?? 14}px` }}
      ref={mdRef}>
      {shouldLoading ? (
        <IconLoading />
      ) : (
        <ReactMarkdown
          remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
          rehypePlugins={[
            RehypeKatex,
            [
              RehypeHighlight,
              {
                detect: false,
                ignoreMissing: true
              }
            ]
          ]}
          components={{
            pre: PreCode
          }}
          linkTarget={"_blank"}>
          {props.content}
        </ReactMarkdown>
      )}
    </div>
  )
}
