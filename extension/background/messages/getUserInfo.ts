import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"
import { rejects } from "assert"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"
import { getCookie } from "~utils/cookie"
import { bgStorage } from "~storage/index"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    await bgStorage.set("lastTabId", req.sender?.tab?.id)
    await bgStorage.set("lastWindowId", req.sender?.tab?.windowId)
    console.log("lastTabId", req.sender?.tab?.id, req.sender?.tab?.windowId)
    const [err, userRes] = await request(appConfig.url.getUserInfo, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
        data: userRes,
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
