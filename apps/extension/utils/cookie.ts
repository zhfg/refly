import { getClientOrigin } from "./url"

export async function getCookie() {
  try {
    const promise = new Promise((resolve, reject) => {
      chrome.cookies?.get(
        {
          name: "_refly_ai_sid",
          url: getClientOrigin(),
        },
        (cookie) => {
          if (cookie?.value) {
            resolve(cookie?.value)
          } else {
            reject("user not auth")
          }
        },
      )
    })

    const res = await promise

    return res
  } catch (err) {
    console.log("err", err)
  }
}
