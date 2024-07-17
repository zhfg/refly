import React from "react"

function FeaturesBlocks() {
  return (
    <section className="px-6 sm:px-6 md:px-6 lg:px-0">
      <div className="border-border2 mx-auto box-content flex w-full max-w-4xl flex-col items-start border-b pb-24 pt-16 text-left sm:pt-20">
        <div className="mb-16 flex flex-col items-start">
          <div className="max-w-3xl">
            <h2 className="z-20 mb-4 text-[2rem] leading-[1.1] !tracking-[-0.1rem] sm:text-[3rem]">
              AI 知识库，AI 笔记，AI Copilot，
              <span
                className="feature-header-highlight"
                style={{
                  background: "#DEECDD",
                  position: "relative",
                  zIndex: 1,
                }}>
                你的 All-in-one 的知识管理操作系统
              </span>
            </h2>
            <p className="max-w-3xl text-base !leading-[1.3] !tracking-[-0.03rem] sm:text-lg">
              <span className="span-wrap-styles">
                结合社区共创的 AI
                技能，无论是文字、图片、视频或是播客，都能轻松高效地完成知识的导入、整理、消化和产出全流程，节省时间和减轻知识焦虑，获取前所未有的洞见。
              </span>
            </p>
          </div>
        </div>
        <div className="rp-1 bg-elementGray border-border2 rounded-lg border sm:rounded-xl sm:p-2">
          <img
            className="shadow-heroImageInner mx-auto w-full rounded-md"
            src="https://static.refly.ai/landing/features-knowledgebase.png"
            width="1024"
            height="504"
            alt="Hero"
          />
        </div>
      </div>
      <div className="border-border2 mx-auto box-content flex w-full max-w-4xl flex-col items-start border-b pb-24 pt-16 text-left sm:pt-20">
        <div className="mb-16 flex flex-col items-start">
          <div className="max-w-3xl">
            <h2 className="z-20 mb-4 text-[2rem] leading-[1.1] !tracking-[-0.1rem] sm:text-[3rem]">
              连接你的任意数据源，
              <span
                className="feature-header-highlight"
                style={{
                  background: "#D5E5EE",
                  position: "relative",
                  zIndex: 1,
                }}>
                通过知识图谱建立知识联系
              </span>
            </h2>
            <p className="max-w-3xl text-base !leading-[1.3] !tracking-[-0.03rem] sm:text-lg">
              <span className="span-wrap-styles">
                无论是 Notion、EverNote、Google Docs 还是本地文档，还是
                Zapier、Retool、Dify 等已有的工作流平台，Refly
                都能轻松融入您已有的知识流程，并借助强大的技能插件系统完成前所未有的工作
              </span>
            </p>
          </div>
        </div>
        <div className="bg-elementGray border-border2 rounded-lg border p-1 sm:rounded-xl sm:p-2">
          <img
            className="shadow-heroImageInner mx-auto w-full rounded-md"
            src="https://static.refly.ai/landing/features-import.png"
            width="1024"
            height="504"
            alt="Hero"
          />
        </div>
      </div>
      <div className="border-border2 mx-auto box-content flex w-full max-w-4xl flex-col items-start border-b pb-24 pt-16 text-left sm:pt-20">
        <div className="mb-16 flex flex-col items-start">
          <div className="max-w-3xl">
            <h2 className="z-20 mb-4 text-[2rem] leading-[1.1] !tracking-[-0.1rem] sm:text-[3rem]">
              通过 Agent 驱动的 Skill 集合，
              <span
                className="feature-header-highlight"
                style={{
                  background: "#F3E1E9",
                  position: "relative",
                  zIndex: 1,
                }}>
                为你打造超级智能知识助手
              </span>
            </h2>
            <p className="max-w-3xl text-base !leading-[1.3] !tracking-[-0.03rem] sm:text-lg">
              <span className="span-wrap-styles">
                通过AI 搜索，知识库智能检索，AI
                笔记等超实用技能集合，主动触发或者通过事件触发技能，Human-in-the-loop
                构建知识体系，基于大模型让知识「活起来」，构建知识体系
              </span>
            </p>
          </div>
        </div>
        <div className="rp-1 bg-elementGray border-border2 rounded-lg border sm:rounded-xl sm:p-2">
          <img
            className="shadow-heroImageInner mx-auto w-full rounded-md"
            src="https://static.refly.ai/landing/features-agent.png"
            width="1024"
            height="504"
            alt="Hero"
          />
        </div>
      </div>
      <div className="border-border2 mx-auto box-content flex w-full max-w-4xl flex-col items-start border-b pb-24 pt-16 text-left sm:pt-20">
        <div className="mb-16 flex flex-col items-start">
          <div className="max-w-3xl">
            <h2 className="z-20 mb-4 text-[2rem] leading-[1.1] !tracking-[-0.1rem] sm:text-[3rem]">
              感知上下文，有记忆
              <span
                className="feature-header-highlight"
                style={{
                  background: "#ECE3D1",
                  position: "relative",
                  zIndex: 1,
                }}>
                更懂你，越用越智能的智能知识伙伴
              </span>
            </h2>
            <p className="max-w-3xl text-base !leading-[1.3] !tracking-[-0.03rem] sm:text-lg">
              <span className="span-wrap-styles">
                按需记录你的历史对话，自动提取你的知识标签与爱好，Refly AI
                感知你的信息、地点、时间与操作知识的行为特征，自动在下一次对话中运用这些知识，让你少打字确更懂你
              </span>
            </p>
          </div>
        </div>
        <div className="bg-elementGray border-border2 rounded-lg border p-1 sm:rounded-xl sm:p-2">
          <img
            className="shadow-heroImageInner mx-auto w-full rounded-md"
            src="https://static.refly.ai/landing/features-private-context.png"
            width="1024"
            height="504"
            alt="Hero"
          />
        </div>
      </div>
      <div className="border-border2 mx-auto box-content flex w-full max-w-4xl flex-col items-start border-b pb-24 pt-16 text-left sm:pt-20">
        <div className="mb-16 flex flex-col items-start">
          <div className="max-w-3xl">
            <h2 className="z-20 mb-4 text-[2rem] leading-[1.1] !tracking-[-0.1rem] sm:text-[3rem]">
              网页，浏览器插件，应用内搜索
              <span
                className="feature-header-highlight"
                style={{
                  background: "#EBD4EB",
                  position: "relative",
                  zIndex: 1,
                }}>
                你的知识，触手可达
              </span>
            </h2>
            <p className="max-w-3xl text-base !leading-[1.3] !tracking-[-0.03rem] sm:text-lg">
              <span className="span-wrap-styles">
                Refly
                智能伙伴可以在任意网页通过快捷键唤醒，你可以与智能伙伴便捷对话，无论完成阅读或写作任务，还是查询自己的历史数据，她都能轻松胜任
              </span>
            </p>
          </div>
        </div>
        <div className="rp-1 bg-elementGray border-border2 rounded-lg border sm:rounded-xl sm:p-2">
          <img
            className="shadow-heroImageInner mx-auto w-full rounded-md"
            src="https://static.refly.ai/landing/features-big-search.png"
            width="1024"
            height="504"
            alt="Hero"
          />
        </div>
      </div>
    </section>
  )
}

export default FeaturesBlocks
