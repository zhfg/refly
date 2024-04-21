import { useTranslation } from "react-i18next"
import { Button, Dropdown, Menu } from "@arco-design/web-react"

export const LanguageList = (props: { children: any }) => {
  // i18n
  const { i18n } = useTranslation()

  const changeLang = (lng: "en" | "cn") => {
    i18n.changeLanguage(lng)
  }

  console.log("用户当前的语言", i18n.languages?.[0])

  const dropList = (
    <Menu
      onClickMenuItem={key => changeLang(key as "en" | "cn")}
      style={{ width: 120 }}>
      <Menu.Item key="cn">简体中文</Menu.Item>
      <Menu.Item key="en">English</Menu.Item>
    </Menu>
  )

  return (
    <Dropdown droplist={dropList} position="bl">
      {props.children}
    </Dropdown>
  )
}
