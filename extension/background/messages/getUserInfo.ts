import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"
import { rejects } from "assert"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"
import { getCookie } from "~utils/cookie"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    const cookie = await getCookie()
    const [err, userRes] = await request(appConfig.url.getUserInfo, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookie}`, // Include the JWT token in the Authorization header
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
