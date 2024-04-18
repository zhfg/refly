import { type PlasmoMessaging } from "@plasmohq/messaging"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"
import { getServerlessWorkOrigin } from "~utils/url"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    const BASEURL = getServerlessWorkOrigin()

    const { pageContent = "", url = "", fileName = "" } = req.body

    const formData = new FormData()
    const blob = new Blob([pageContent], { type: "text/html" })
    const file = new File([blob], fileName || `test.html`, {
      type: "text/html",
    })

    formData.append("file", file)
    formData.append("url", url)

    const [err, uploadHtmlRes] = await request(
      `${BASEURL}${appConfig.url.uploadHtml}`,
      {
        method: "POST",
        body: formData,
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
        data: uploadHtmlRes,
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
