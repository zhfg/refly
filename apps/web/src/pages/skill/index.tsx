import { useState } from "react"

// components
import { useTranslation } from "react-i18next"
import { SkillInstanceList } from "@refly-packages/ai-workspace-common/components/skill/skill-intance-list"
import { SkillTemplateList } from "@refly-packages/ai-workspace-common/components/skill/skill-template-list"

import { useSearchParams } from "@refly-packages/ai-workspace-common/utils/router"
import "./index.scss"

import { Radio } from "@arco-design/web-react"

const RadioGroup = Radio.Group

const ContentHeader = (props: {
  val: string
  setVal: (val: string) => void
}) => {
  const { setVal, val } = props
  const { t } = useTranslation()
  return (
    <div className="skill-list__header flex items-center">
      <RadioGroup
        type="button"
        size="large"
        className="skill-list__tabs"
        defaultValue={val}
        onChange={val => setVal(val)}>
        <Radio value="intance" style={{ whiteSpace: "nowrap" }}>
          {t("skill.tab.skillInstances")}
        </Radio>
        <Radio value="template" style={{ whiteSpace: "nowrap" }}>
          {t("skill.tab.skillTemplate")}
        </Radio>
      </RadioGroup>
    </div>
  )
}

const Skill = () => {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") as string
  const [val, setVal] = useState(
    ["template", "instance"].includes(tab) ? tab : "intance",
  )

  return (
    <div className="skill-list">
      <ContentHeader setVal={setVal} val={val} />
      <div className="skill-list__content">
        {val === "intance" ? (
          <SkillInstanceList canGoDetail={true} />
        ) : (
          <SkillTemplateList />
        )}
      </div>
    </div>
  )
}

export default Skill
