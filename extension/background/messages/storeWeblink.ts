import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    const historyItem = await chrome.history.search({ text: req.body?.url })
    const weblink = { ...(historyItem?.[0] || {}), ...req.body }
    const [err, storeRes] = await request(appConfig.url.storeWeblink, {
      method: "POST",
      body: {
        data: [weblink],
      },
    })
    if (err) {
      res.send({
        success: false,
        errMsg: err,
      })
    } else {
      res.send({
        success: true,
        data: storeRes,
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
