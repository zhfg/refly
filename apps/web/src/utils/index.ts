import md5 from "md5"
import { v4 as UUIDV4 } from "uuid"

export const genUniqueId = () => {
  const uuid = UUIDV4()
  const timestamp = new Date().getTime()
  const randomString =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  const id = `${uuid}${timestamp}${randomString}`
  return md5(id)
}

export function timestampFormat(timestamp: number) {
  function zeroize(num: number) {
    return (String(num).length == 1 ? "0" : "") + num
  }

  const curTimestamp = new Date().getTime() / 1000 // 当前时间戳
  const updateTimestamp = timestamp / 1000
  const timestampDiff = curTimestamp - updateTimestamp // 参数时间戳与当前时间戳相差秒数

  const curDate = new Date(curTimestamp * 1000) // 当前时间日期对象
  const tmDate = new Date(updateTimestamp * 1000) // 参数时间戳转换成的日期对象

  const Y = tmDate.getFullYear(),
    m = tmDate.getMonth() + 1,
    d = tmDate.getDate()
  const H = tmDate.getHours(),
    i = tmDate.getMinutes(),
    s = tmDate.getSeconds()

  if (timestampDiff < 60) {
    // 一分钟以内
    return "刚刚"
  } else if (timestampDiff < 3600) {
    // 一小时前之内
    return Math.floor(timestampDiff / 60) + "分钟前"
  } else if (
    curDate.getFullYear() == Y &&
    curDate.getMonth() + 1 == m &&
    curDate.getDate() == d
  ) {
    return "今天" + zeroize(H) + ":" + zeroize(i)
  } else {
    const newDate = new Date((curTimestamp - 86400) * 1000) // 参数中的时间戳加一天转换成的日期对象
    if (
      newDate.getFullYear() == Y &&
      newDate.getMonth() + 1 == m &&
      newDate.getDate() == d
    ) {
      return "昨天" + zeroize(H) + ":" + zeroize(i)
    } else if (curDate.getFullYear() == Y) {
      return (
        zeroize(m) + "月" + zeroize(d) + "日 " + zeroize(H) + ":" + zeroize(i)
      )
    } else {
      return (
        Y +
        "年" +
        zeroize(m) +
        "月" +
        zeroize(d) +
        "日 " +
        zeroize(H) +
        ":" +
        zeroize(i)
      )
    }
  }
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    // clipboard api 复制
    navigator.clipboard.writeText(text)
  } else {
    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    // 隐藏此输入框
    textarea.style.position = "fixed"
    textarea.style.clip = "rect(0 0 0 0)"
    textarea.style.top = "10px"
    // 赋值
    textarea.value = text
    // 选中
    textarea.select()
    // 复制
    document.execCommand("copy", true)
    // 移除输入框
    document.body.removeChild(textarea)
  }
}

export const downloadPlugin = async () => {
  window.open("http://localhost:5173/")
}

export const openGetStartDocument = async () => {
  window.open("https://refly.ai/docs")
}
