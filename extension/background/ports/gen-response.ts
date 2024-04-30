import { type PlasmoMessaging } from "@plasmohq/messaging"

import { TASK_STATUS, TASK_TYPE, type Task } from "~/types"
import { safeParseJSON } from "~utils/parse"
import { getServerOrigin } from "~utils/url"
import { fetchEventSource } from "~utils/fetch-event-source"
import { getCookie } from "~utils/cookie"
// utils
import { fetchStream } from "~utils/fetch-stream"
import { getExtensionVersion } from "~utils/version"

let abortController: AbortController

const LLM_SPLIT = "__LLM_RESPONSE__"
const RELATED_SPLIT = "__RELATED_QUESTIONS__"

const handler: PlasmoMessaging.PortHandler<{
  type: TASK_STATUS
  payload: Task
}> = async (req, res) => {
  const { type, payload } = req?.body || {}
  console.log("receive request", req.body)

  try {
    if (type === TASK_STATUS.START) {
      // 确保上一次是 aborted 了
      abortController?.abort?.()

      abortController = new AbortController()

      const cookie = await getCookie()

      const decoder = new TextDecoder()
      let uint8Array = new Uint8Array()
      let chunks = ""
      let sourcesEmitted = false

      const response = await fetch(
        `${getServerOrigin()}/v1/conversation/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookie}`,
            "x-refly-ext-version": getExtensionVersion(),
          },
          signal: abortController.signal,
          body: JSON.stringify({
            task: payload,
          }),
        },
      )
      if (response.status !== 200) {
        res.send({
          type: "error",
          message: response.status,
        })
        return
      }
      const markdownParse = (text: string) => {
        res.send({
          type: "content",
          message: text
            .replace(/\[\[([cC])itation/g, "[citation")
            .replace(/[cC]itation:(\d+)]]/g, "citation:$1]")
            .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
            .replace(/\[[cC]itation:(\d+)]/g, "[citation]($1)"),
        })
      }
      fetchStream(
        response,
        (chunk) => {
          uint8Array = new Uint8Array([...uint8Array, ...chunk])
          chunks = decoder.decode(uint8Array, { stream: true })
          if (chunks.includes(LLM_SPLIT)) {
            const [sources, rest] = chunks.split(LLM_SPLIT)
            if (!sourcesEmitted) {
              try {
                res.send({
                  type: "source",
                  message: sources,
                })
              } catch (e) {
                res.send({
                  type: "source",
                  message: JSON.stringify([]),
                })
              }
            }
            sourcesEmitted = true
            if (rest.includes(RELATED_SPLIT)) {
              const [md] = rest.split(RELATED_SPLIT)
              markdownParse(md)
            } else {
              markdownParse(rest)
            }
          }
        },
        () => {
          const [_, relates] = chunks.split(RELATED_SPLIT)
          try {
            res.send({
              type: "relatedQuestions",
              message: relates,
            })
          } catch (e) {
            res.send({
              type: "relatedQuestions",
              message: JSON.stringify([]),
            })
          }
        },
      )
    } else if (type === TASK_STATUS.SHUTDOWN) {
      abortController.abort()
      res.send({ message: "[DONE]" })
    }
  } catch (err) {
    console.log("err", err)
    // 最终也需要 abort 确保关闭
    abortController?.abort?.()
  }
}

export default handler
