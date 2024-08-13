import { useState } from "react"

// components
import { useTranslation } from "react-i18next"
import { SkillInstanceList } from "@refly/ai-workspace-common/components/skill/skill-intance-list"
import { SkillTemplateList } from "@refly/ai-workspace-common/components/skill/skill-template-list"

import "./index.scss"

import { Radio } from "@arco-design/web-react"

const RadioGroup = Radio.Group

const ContentHeader = (props: { setVal: (val: string) => void }) => {
  const { setVal } = props
  const { t } = useTranslation()
  return (
    <div className="skill-list__header flex items-center">
      <RadioGroup
        type="button"
        size="large"
        className="skill-list__tabs"
        defaultValue="intance"
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
  const [val, setVal] = useState("intance")

  return (
    <div className="skill-list">
      <ContentHeader setVal={setVal} />
      <div className="skill-list__content">
        {val === "intance" ? <SkillInstanceList /> : <SkillTemplateList />}
      </div>
    </div>
  )
}

export default Skill
