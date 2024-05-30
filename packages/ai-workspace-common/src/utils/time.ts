import { LOCALE } from "@/types"
import dayjsConfig from "./dayjsConfig"

export function timestampFormat(
  timestamp: number = new Date().getTime(),
  language = "cn",
) {
  function zeroize(num: number) {
    return (String(num).length == 1 ? "0" : "") + num
  }

  const curTimestamp = new Date().getTime() / 1000 // 当前时间戳
  const updateTimestamp = timestamp / 1000
  const timestampDiff = curTimestamp - updateTimestamp // 参数时间戳与当前时间戳相差秒数

  const curDate = new Date(curTimestamp * 1000) // 当前时间日期对象
  const tmDate = new Date(updateTimestamp * 1000) // 参数时间戳转换成的日期对象

  // TODO: 国际化需要修改
  const Y = tmDate.getFullYear(),
    m = tmDate.getMonth() + 1,
    d = tmDate.getDate()
  const H = tmDate.getHours(),
    i = tmDate.getMinutes(),
    s = tmDate.getSeconds()

  if (timestampDiff < 60) {
    // 一分钟以内
    return language === "en" ? "just now" : "刚刚"
  } else if (timestampDiff < 3600) {
    // 一小时前之内
    return Math.floor(timestampDiff / 60) + language === "en"
      ? " minutes ago"
      : "分钟前"
  } else if (
    curDate.getFullYear() == Y &&
    curDate.getMonth() + 1 == m &&
    curDate.getDate() == d
  ) {
    return language === "en"
      ? "today "
      : "今天 " + zeroize(H) + ":" + zeroize(i)
  } else {
    const newDate = new Date((curTimestamp - 86400) * 1000) // 参数中的时间戳加一天转换成的日期对象
    if (
      newDate.getFullYear() == Y &&
      newDate.getMonth() + 1 == m &&
      newDate.getDate() == d
    ) {
      return language === "en"
        ? "yesterday "
        : "昨天 " + zeroize(H) + ":" + zeroize(i)
    } else if (curDate.getFullYear() == Y) {
      return zeroize(m) + language === "en"
        ? "month"
        : "月" + zeroize(d) + language === "en"
          ? "day"
          : "日" + zeroize(H) + ":" + zeroize(i)
    } else {
      return Y + language === "en"
        ? "year"
        : "年 " + zeroize(m) + language === "en"
          ? "month"
          : "月" + zeroize(d) + language === "en"
            ? "day"
            : "日 " + zeroize(H) + ":" + zeroize(i)
    }
  }
}

export const time = (
  date: string | number | Date | dayjsConfig.Dayjs,
  locale: LOCALE = LOCALE.EN,
) => {
  return dayjsConfig(date, { locale })
}

export const getCurrentDateInfo = () => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1 // Months are zero-indexed, so we add 1
  const day = currentDate.getDate()

  console.log(`Today is ${year}-${month}-${day}`) // Output: Today is 2024-3-29

  return { year, month, day }
}
