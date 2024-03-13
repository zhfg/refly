// 通过 fetch 来处理数据，支持 GET/POST 请求的流式数据

interface EventSourceOptions extends RequestInit {
  onopen?: (msg: string) => void
  onmessage?: (msg: string) => void
  onclose?: (msg: string) => void
  onerror?: (msg: any) => void
  abortController?: AbortController
}

export const fetchEventSource = async (
  url: string,
  options: EventSourceOptions,
) => {
  try {
    const genResp = await fetch(url, options)

    const reader = genResp?.body?.getReader()

    let sourcesStr = ""
    let isHandledSource = false
    let sourceMessages: string[] = []

    while (true) {
      // @ts-ignore
      const { done, value } = await reader.read()
      const decodedValue = new TextDecoder("utf-8").decode(value)
      console.log("decodedValue", decodedValue)

      if (options?.abortController?.signal.aborted) {
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
              .filter(val => val)
            sourceMessages.forEach(
              message => options?.onmessage && options.onmessage(message),
            )

            // reset source 相关内容，一次请求只处理一次
            isHandledSource = true
            sourcesStr = ""
          }

          const messages = decodedValue
            ?.split("refly-sse-data: ")
            .filter(val => val)
          messages.forEach(
            message => options?.onmessage && options.onmessage(message),
          )
        } else if (!isHandledSource) {
          // 搜索 sources
          sourcesStr += decodedValue

          if (sourcesStr && !isHandledSource) {
            // 遇到普通数据之后，先发 sources
            sourceMessages = sourcesStr
              ?.split("refly-sse-source: ")
              .filter(val => val)
              .filter(val => {
                if (val?.includes(`[REFLY-SOURCE-END]`)) {
                  isHandledSource = true
                  return false
                }
                return true
              })
          }

          if (isHandledSource) {
            sourceMessages.forEach(
              message => options?.onmessage && options.onmessage(message),
            )

            // reset source 相关内容，一次请求只处理一次
            isHandledSource = true
            sourcesStr = ""
          }
        }
      }
    }
  } catch (err) {
    options?.onerror && options?.onerror(err)
  }
}
