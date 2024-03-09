import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req.body)

  sendToContentScript({
    name: "runRefly",
    body: {
      toggle: true
    }
  })
}

export default handler
