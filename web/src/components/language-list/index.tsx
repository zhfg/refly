import { useTranslation } from "react-i18next"
import { Button, Dropdown, Menu } from "@arco-design/web-react"
import { useUserStore } from "@/stores/user"
import { safeStringifyJSON } from "@/utils/parse"
import { LOCALE } from "@/types"

export const LanguageList = (props: { children: any }) => {
  // i18n
  const { i18n } = useTranslation()
  const userStore = useUserStore()

  const changeLang = (lng: LOCALE) => {
    const { localSettings } = useUserStore.getState()

    i18n.changeLanguage(lng)
    userStore.setLocalSettings({ ...localSettings, locale: lng })
    localStorage.setItem(
      "refly-local-settings",
      safeStringifyJSON({ ...localSettings, locale: lng }),
    )
  }

  console.log("用户当前的语言", i18n.languages?.[0])

  const dropList = (
    <Menu
      onClickMenuItem={key => changeLang(key as LOCALE)}
      style={{ width: 120 }}>
      <Menu.Item key="zh-CN">简体中文</Menu.Item>
      <Menu.Item key="en">English</Menu.Item>
    </Menu>
  )

  return (
    <Dropdown droplist={dropList} position="bl">
      {props.children}
    </Dropdown>
  )
}
