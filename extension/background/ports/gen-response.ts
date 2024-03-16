import { type PlasmoMessaging } from "@plasmohq/messaging"

import { TASK_STATUS, TASK_TYPE, type Task } from "~/types"
import { safeParseJSON } from "~utils/parse"
import { getServerOrigin } from "~utils/url"
import { fetchEventSource } from "~utils/fetch-event-source"
import { getCookie } from "~utils/cookie"

let abortController: AbortController

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

      // TODO: 这里未来要优化
      const conversationId = payload?.data?.conversationId

      const cookie = await getCookie()

      await fetchEventSource(
        `${getServerOrigin()}/v1/conversation/${conversationId}/chat`,
        {
          method: "POST",
          body: JSON.stringify({
            task: payload,
          }),
          headers: {
            Authorization: `Bearer ${cookie}`, // Include the JWT token in the Authorization header
            "Content-Type": "application/json",
          },
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
    // 最终也需要 abort 确保关闭
    abortController?.abort?.()
  }
}

export default handler
