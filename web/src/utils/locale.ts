export const mapCNLocale = (locale: string) => {
  if (locale?.toLocaleLowerCase()?.startsWith("zh")) {
    return "zh-CN"
  }

  return locale
}
