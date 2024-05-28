import { type PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(`injectContent`, req.body)

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const { id } = tabs[0]
    console.log("currentTabid", id)

    chrome.scripting
      .executeScript({
        target: { tabId: id },
        func: () => {
          const style = document.createElement("style")
          style.textContent = `
          * {
          cursor: default !important;
        }
        .refly-content-selector-mark {
          cursor: pointer !important;
        }
        .refly-content-selector-mark:hover {
          background-color: #00968F26 !important;
          border-radius: 4px;
        }
        input,
        textarea {
          pointer-events: none;
        }

        .refly-content-selected-target {
          background-color: #00968F26 !important;
          border-radius: 4px;
        }
          `
          document.head.appendChild(style)
        },
      })
      .then(() => {
        console.log("Inject content selector style success")
      })
      .catch((err) =>
        console.log(`Inject content selector style failed: ${err}`),
      )
  })
}

export default handler
