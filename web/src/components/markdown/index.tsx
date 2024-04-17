import { IconLoading } from "@arco-design/web-react/icon"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Message as message } from "@arco-design/web-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

import "katex/dist/katex.min.css"

import copyToClipboard from "copy-to-clipboard"
import RehypeHighlight from "rehype-highlight"
import RehypeKatex from "rehype-katex"
import RemarkBreaks from "remark-breaks"
import RemarkGfm from "remark-gfm"
import RemarkMath from "remark-math"

// styles
import "./styles/markdown.scss"
import "./styles/highlight.scss"
import { Source } from "@/types"

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
            message.success("复制成功")
          }
        }}></span>
      {props.children}
    </pre>
  )
}

export function ATag({ ...props }, sources: Source[]) {
  if (!props.href) return <></>
  const source = sources[+props.href - 1]
  if (!source) return <a href={props.href}>{props.href}</a>
  return (
    <span className="inline-block w-4">
      <Popover>
        <PopoverTrigger asChild>
          <span
            title={source.metadata?.title}
            className="inline-block cursor-pointer transform scale-[60%] no-underline font-medium bg-zinc-300 hover:bg-zinc-400 w-6 text-center h-6 rounded-full origin-top-left">
            {props.href}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align={"start"}
          className="max-w-screen-md flex flex-col gap-2 bg-white shadow-transparent ring-zinc-50 ring-4 text-xs">
          <div className="text-ellipsis overflow-hidden whitespace-nowrap font-medium">
            {source.metadata?.title}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="line-clamp-4 text-zinc-500 break-words">
                {source.pageContent}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex-1 overflow-hidden">
              <div className="text-ellipsis text-blue-500 overflow-hidden whitespace-nowrap">
                <a
                  title={source.metadata?.title}
                  href={source.metadata?.source}
                  target="_blank">
                  {source.metadata?.source}
                </a>
              </div>
            </div>
            <div className="flex-none flex items-center relative">
              <img
                className="h-3 w-3"
                alt={source.metadata?.source}
                src={`https://www.google.com/s2/favicons?domain=${source.metadata?.source}&sz=${16}`}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  )
}

export function Markdown(
  props: {
    content: string
    loading?: boolean
    fontSize?: number
    sources?: Source[]
  } & React.DOMAttributes<HTMLDivElement>,
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
                ignoreMissing: true,
              },
            ],
          ]}
          components={{
            pre: PreCode,
            a: args => ATag(args, props?.sources || []),
          }}
          linkTarget={"_blank"}>
          {props.content}
        </ReactMarkdown>
      )}
    </div>
  )
}
