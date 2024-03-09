import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"

import { appConfig } from "~utils/config"
import { request } from "~utils/request"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  try {
    const commands = (await chrome.commands.getAll()) || []
    res.send(commands)
  } catch (err) {
    res.send([])
  }
}

export default handler
