import { TASK_STATUS, Task } from "@/types"
import { getServerOrigin } from "@/utils/url"
import { fetchEventSource } from "@/utils/fetch-event-source"
import { getAuthTokenFromCookie } from "@/utils/request"

import type { HandlerRequest } from "@/types/request"

let abortController: AbortController

const handler = async (
  req: HandlerRequest<{
    type: TASK_STATUS
    payload?: Task
    weblinkList?: string[]
  }>,
  options: { onMessage: (msg: { message: string }) => void },
) => {
  const { type, payload } = req?.body || {}
  console.log("receive request", req.body)

  try {
    if (type === TASK_STATUS.START) {
      abortController = new AbortController()

      const conversationId = payload?.data?.conversationId

      await fetchEventSource(
        `${getServerOrigin()}/v1/conversation/${conversationId}/chat`,
        {
          method: "POST",
          body: JSON.stringify({
            task: payload,
          }),
          headers: {
            // TODO: check auth token before making a request, and if it not exists, redirect to login
            Authorization: `Bearer ${getAuthTokenFromCookie()}`,
            "Content-Type": "application/json",
          },
          onmessage(data) {
            if (data === "[DONE]") {
              console.log("EventSource done")
              options.onMessage({ message: "[DONE]" })
            } else {
              options.onMessage({ message: data })
            }
          },
          onerror(error) {
            console.log("EventSource failed:", error)

            // 这里是因为 evtSource 之后会进行重试
            // options.onMessage({ message: "Meet Error" })
            options.onMessage({ message: "[DONE]" })
          },
          signal: abortController.signal,
        },
      )
    } else if (type === TASK_STATUS.SHUTDOWN) {
      abortController.abort()
      options.onMessage({ message: "[DONE]" })
    }
  } catch (err) {
    console.log("err", err)
  } finally {
    // 最终也需要 abort 确保关闭
    abortController?.abort?.()
  }
}

export default handler
