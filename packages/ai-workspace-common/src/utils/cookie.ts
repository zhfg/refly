import Cookies from "js-cookie"

export async function getCookie(cookieName = "_refly_ai_sid") {
  try {
    return Cookies.get(cookieName)
  } catch (err) {
    console.log("err", err)
  }
}
