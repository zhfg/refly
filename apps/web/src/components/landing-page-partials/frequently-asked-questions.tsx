import { BsQuestionDiamond } from "react-icons/bs"

import type { CollapseProps } from "antd"
import { Collapse } from "antd"
import { useTranslation } from "react-i18next"
import { CSSProperties } from "react"

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`

const getItems: (
  panelStyle: CSSProperties,
) => CollapseProps["items"] = panelStyle => [
  {
    key: "1",
    label: "This is panel header 1",
    children: <p>{text}</p>,
    style: panelStyle,
  },
  {
    key: "2",
    label: "This is panel header 2",
    children: <p>{text}</p>,
    style: panelStyle,
  },
  {
    key: "3",
    label: "This is panel header 3",
    children: <p>{text}</p>,
    style: panelStyle,
  },
]

function FrequentlyAskedQuestions() {
  const { t } = useTranslation()
  const panelStyle: React.CSSProperties = {
    marginBottom: 24,
    background: "#F5F5F5",
    borderRadius: 8,
    border: "none",
  }

  const items = [1, 2, 3, 4].map(item => ({
    key: item,
    label: <div className="font-bold">{t(`landingPage.faq.Q${item}`)}</div>,
    children: <p>{t(`landingPage.faq.A${item}`)}</p>,
    style: panelStyle,
  }))

  return (
    <div className="flex w-full justify-center pt-12 md:pt-16">
      <div className="flex w-[70%] flex-col px-4">
        <div className="mb-4 text-2xl font-bold">
          {t("landingPage.faq.title")}
        </div>
        <div className="flex-grow">
          <Collapse
            bordered={false}
            style={{ background: "transparent" }}
            items={items}
          />
        </div>
      </div>
    </div>
  )
}

export default FrequentlyAskedQuestions
