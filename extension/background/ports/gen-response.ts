import { type PlasmoMessaging } from "@plasmohq/messaging"

import { TASK_STATUS, TASK_TYPE } from "~/types"
import { getServerOrigin } from "~utils/url"

let abortController: AbortController

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const { type, payload } = req?.body || {}
  console.log("receive request", req.body)

  try {
    if (type === TASK_STATUS.START) {
      abortController = new AbortController()
 
      // TODO: 这里未来要优化
      const messageItems = req.body?.payload?.data?.items || [];
      const question = messageItems?.[messageItems.length - 1]?.data?.content
      const conversationId = messageItems?.[messageItems.length - 1]?.conversationId

      const evtSource = new EventSource(
        `${getServerOrigin()}/v1/conversation/${conversationId}/chat?query=${question}`
      )
      evtSource.onmessage = (ev: MessageEvent<any>) => {
        console.log('onmessage', ev.data);
        if (ev?.data === "[DONE]") {
          console.log("EventSource done")
          res.send({ message: "[DONE]" })
          evtSource.close()
        } else {
          res.send({ message: ev.data })
        }
      }

      evtSource.onerror = (error) => {
        console.log("EventSource failed:", error)

        // 这里是因为 evtSource 之后会进行重试
        res.send({ message: "Meet Error" })
        res.send({ message: "[DONE]" })
        evtSource.close()
      }

      // const genResp = await fetch(`${getServerOrigin()}/api/generate/gen`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json"
      //   },
      //   signal: abortController.signal,
      //   body: JSON.stringify({
      //     ...(payload || {})
      //   })
      // })

      // const stream = genResp?.body
      // const reader = stream?.getReader()

      // while (true) {
      //   const { done, value } = await reader?.read()
      //   const decodedValue = new TextDecoder().decode(value)

      //   if (abortController.signal.aborted) {
      //     res.send({ message: "[DONE]" })
      //     break
      //   }

      //   if (
      //     done ||
      //     decodedValue === "[DONE]" ||
      //     (value as any as string) === "[DONE]"
      //   ) {
      //     res.send({ message: decodedValue }) // 把结束标志传回去，让用户做进一步操作
      //     break
      //   }

      //   res.send({ message: decodedValue })
      // }
    } else if (type === TASK_STATUS.SHUTDOWN) {
      abortController.abort()
      res.send({ message: "[DONE]" })
    }
  } catch (err) {
    console.log("err", err)
  } finally {
  }
}

export default handler
