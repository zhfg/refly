import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    const [err, knowledgeBaseListRes] = await request(
      appConfig.url.getKnowledgeBaseList,
      {
        method: "GET",
        body: req.body,
      },
    )
    if (err) {
      res.send({
        success: false,
        errMsg: err,
      })
    } else {
      res.send({
        success: true,
        data: knowledgeBaseListRes,
      })
    }
  } catch (err) {
    res.send({
      success: false,
      errMsg: err,
    })
  }
}

export default handler
