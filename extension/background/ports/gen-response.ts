import { type PlasmoMessaging } from "@plasmohq/messaging"

import { TASK_STATUS, TASK_TYPE } from "~/types"
import { safeParseJSON } from "~utils/parse"
import { getServerOrigin } from "~utils/url"

let abortController: AbortController

// 通过 fetch 来处理数据，支持 GET/POST 请求的流式数据
const fetchEventSource = async (url, options) => {
  try {
    const genResp = await fetch(url, options)

    const reader = genResp?.body?.getReader()

    let sourcesStr = ""
    let isHandledSource = false

    while (true) {
      const { done, value } = await reader?.read()
      const decodedValue = new TextDecoder("utf-8").decode(value)
      console.log("decodedValue", decodedValue)

      if (abortController.signal.aborted) {
        options?.onclose && options.onclose(`[DONE]`)
        break
      }

      if (
        done ||
        decodedValue === "[DONE]" ||
        (value as any as string) === "[DONE]"
      ) {
        options?.onclose && options.onclose(`[DONE]`)
        options?.onmessage && options.onmessage(`[DONE]`)
        break
      }

      console.log()
      if (decodedValue) {
        // 普通数据
        if (decodedValue?.includes("refly-sse-data")) {
          if (sourcesStr && !isHandledSource) {
            // 遇到普通数据之后，先发 sources
            const sourceMessages = sourcesStr
              ?.split("refly-sse-source: ")
              .filter((val) => val)
            sourceMessages.forEach(
              (message) => options?.onmessage && options.onmessage(message),
            )

            // reset source 相关内容，一次请求只处理一次
            isHandledSource = true
            sourcesStr = ""
          }

          const messages = decodedValue
            ?.split("refly-sse-data: ")
            .filter((val) => val)
          messages.forEach(
            (message) => options?.onmessage && options.onmessage(message),
          )
        } else {
          // 搜索 sources
          sourcesStr += decodedValue
        }
      }
    }
  } catch (err) {
    options?.onerror && options?.onerror(err)
  }
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const { type, payload } = req?.body || {}
  console.log("receive request", req.body)

  try {
    if (type === TASK_STATUS.START) {
      abortController = new AbortController()

      // TODO: 这里未来要优化
      const messageItems = req.body?.payload?.data?.items || []
      const question = messageItems?.[messageItems.length - 1]?.data?.content
      const conversationId =
        messageItems?.[messageItems.length - 1]?.conversationId

      await fetchEventSource(
        `${getServerOrigin()}/v1/conversation/${conversationId}/chat?query=${question}`,
        {
          method: "POST",
          body: JSON.stringify({
            weblinkList: [],
          }),
          onmessage(data) {
            if (data === "[DONE]") {
              console.log("EventSource done")
              res.send({ message: "[DONE]" })
            } else {
              res.send({ message: data })
            }
          },
          onerror(error) {
            console.log("EventSource failed:", error)

            // 这里是因为 evtSource 之后会进行重试
            // res.send({ message: "Meet Error" })
            res.send({ message: "[DONE]" })
          },
          signal: abortController.signal,
        },
      )
    } else if (type === TASK_STATUS.SHUTDOWN) {
      abortController.abort()
      res.send({ message: "[DONE]" })
    }
  } catch (err) {
    console.log("err", err)
  } finally {
    // 最终也需要 abort 确保关闭
    abortController?.abort?.()
  }
}

export default handler
