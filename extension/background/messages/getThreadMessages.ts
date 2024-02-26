import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    const { threadId } = req.body;
    const [err, threadRes] = await request(
      appConfig.url.getThreadMessages(threadId),
      {
        method: "GET",
      }
    )
    if (err) {
      res.send({
        success: false,
        errMsg: err
      })
    } else {
      res.send({
        success: true,
        data: threadRes
      })
    }
  } catch (err) {
    res.send({
      success: false,
      errMsg: err
    })
  }
}

export default handler
