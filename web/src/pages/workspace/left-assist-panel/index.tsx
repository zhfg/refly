import { useUserStore } from "@/stores/user"
import { cnGuessQuestions, enGuessQuestions } from "@/utils/guess-question"
import { Avatar } from "@arco-design/web-react"
import { useTranslation } from "react-i18next"

// 自定义组件
import { KnowledgeKeywordList } from "../knowledge-keyword-list"
import { IconRight } from "@arco-design/web-react/icon"

export const LeftAssistPanel = () => {
  const userStore = useUserStore()
  const { t, i18n } = useTranslation()

  const language = i18n.languages?.[0]
  const guessQuestions = language?.includes("en")
    ? enGuessQuestions
    : cnGuessQuestions

  return (
    <div className="left-assist-panel-container">
      <div className="welcome-module">
        <div className="user">
          <Avatar></Avatar>
          <p>
            {t("workspace.leftPanel.welcomeTitle")}{" "}
            {userStore?.userProfile?.name}
          </p>
        </div>
        <div className="welcome-question">
          <p>{t("workspace.leftPanel.welcomeQuestion")}</p>
        </div>
        <div className="guess-question">
          <p>{t("workspace.leftPanel.guessTitle")}</p>
          <div className="guess-question-list">
            {guessQuestions.map((item, index) => {
              return (
                <div className="guess-question-item" key={index}>
                  {item}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="keyword-module">
        <div className="keyword-title">
          <p>{t("workspace.leftPanel.keyword.title")}</p>
        </div>
        <div className="keyword-list">
          <KnowledgeKeywordList />
        </div>
        <div className="keyword-see-more">
          <p>{t("workspace.leftPanel.keyword.seeMore")}</p>
          <IconRight />
        </div>
      </div>
    </div>
  )
}
