import React from "react"

// Feature type definition for better type safety
interface Feature {
  tag: string
  tagIcon?: string
  title: string
  description: string
  bulletPoints: string[]
  imageSrc: string
  isReversed?: boolean
  background?: string
}

interface FeatureCardProps {
  isReversed?: boolean
  background?: string
}

const FeatureCard = ({
  feature,
  isReversed = false,
  background = "linear-gradient(180deg, #F3EEFC 0%, #FFFFFF 100%)",
}: FeatureCardProps & { feature: Feature }) => (
  <div className="relative mx-auto mt-[40px] w-full md:w-[65%]">
    <div
      className="min-h-[360px] w-full overflow-visible rounded-[20px] md:h-[600px]"
      style={{
        background,
        border: "1px solid rgba(0, 0, 0, 0.05)",
      }}>
      <div
        className={`flex h-full flex-col gap-6 p-6 md:flex-row ${
          isReversed ? "md:flex-row-reverse" : ""
        }`}>
        {/* Image Section */}
        <div className="relative h-[260px] md:h-auto md:w-1/2">
          <img
            src={feature?.imageSrc ?? "/fallback-image.png"}
            alt={`${feature?.title ?? "Feature"} visualization`}
            className="absolute h-full w-[130%] object-contain"
            style={{
              [isReversed ? "right" : "left"]: "-30%",
              borderRadius: "20px",
              opacity: 1,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Content Section */}
        <div className="flex flex-col justify-center md:w-1/2">
          <span className="mb-3 inline-block w-fit rounded-lg border border-solid border-black/10 bg-white px-4 py-1 text-sm font-medium shadow-[0_3px_20px_0_rgba(0,0,0,0.10)]">
            {feature?.tagIcon && (
              <span className="mr-2">{feature.tagIcon}</span>
            )}
            {feature?.tag}
          </span>
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            {feature?.description}
          </h2>
          <ul className="space-y-3">
            {feature?.bulletPoints?.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  ✓
                </span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
)

function FeaturesBlocks() {
  const header = {
    tag: "Features",
    tagIcon: "⚛️",
    title: "An Overview of Refly's Primary Features",
  }

  // Sample feature data
  const features: Feature[] = [
    {
      tag: "Plan",
      tagIcon: "⚛️",
      title: "An Overview of Refly's Primary Features",
      description: "头脑风暴、梳理大纲、将想法转为可落地的行动",
      bulletPoints: [
        "20+ 场景，适配学术论文、竞品调研、技术文章、自媒体撰文、项目、OKR",
        "AI 一键生成内容大纲",
        "基于历史知识进行推荐、关联记忆",
      ],
      imageSrc: "https://static.refly.ai/landing/generateOutline.png",
      isReversed: false,
      background: "linear-gradient(180deg, #F3EEFC 0%, #FFFFFF 100%)",
    },
    {
      tag: "Explore & Import",
      tagIcon: "⚛️",
      title: "An Overview of Refly's Primary Features",
      description: "连接任何数据，并添加为可写作的素材",
      bulletPoints: [
        "AI 搜索智能发现",
        "浏览器插件导入私有数据",
        "Refly 网页导入任何公有数据或文本",
        "自动语义处理并使用知识库搜索获取关键洞见",
      ],
      imageSrc: "https://static.refly.ai/landing/importResource.png",
      isReversed: true,
      background: "linear-gradient(180deg, #EAF6FF 0%, #FFFFFF 100%)",
    },
    {
      tag: "Research",
      tagIcon: "⚛️",
      title: "An Overview of Refly's Primary Features",
      description: "快速从每一个知识库、资源和每一行文字挖掘洞见",
      bulletPoints: [
        "AI 搜索进行实时回答",
        "基于你最相关的上下文得到答案",
        "通过浏览器插件和上下文选择器研究细节",
      ],
      imageSrc: "https://static.refly.ai/landing/research.png",
      isReversed: false,
      background: "linear-gradient(180deg, #FFF3F3 0%, #FFFFFF 100%)",
    },
    {
      tag: "Thinking & Creation",
      tagIcon: "⚛️",
      title: "An Overview of Refly's Primary Features",
      description: "基于你的上下文语境，使用最强大的模型愉快的撰写目标文章",
      bulletPoints: [
        "选择资源、笔记或划线任意内容进行提问",
        "30+ 撰写写作、阅读、审稿而生的 AI 技能",
        "通过 AI Apply 一键插入，引用溯源 AI 撰写内容来源",
      ],
      imageSrc: "https://static.refly.ai/landing/generateArticle.png",
      isReversed: true,
      background: "linear-gradient(180deg, #F3FFF3 0%, #FFFFFF 100%)",
    },
  ]

  return (
    <section className="mt-[98px] px-6 sm:px-6 md:px-6 lg:px-0">
      {/* Header Section */}
      <div className="mb-16 text-center">
        <span className="mb-8 inline-block rounded-lg border border-solid border-black/10 bg-white px-6 py-2 text-sm font-medium shadow-[0_3px_20px_0_rgba(0,0,0,0.10)]">
          {header?.tagIcon && <span className="mr-2">{header.tagIcon}</span>}
          {header?.tag}
        </span>
        <section className="text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            {header?.title?.split("Primary Features")[0] ??
              "An Overview of Refly's"}
            <div className="mt-2">
              <span className="relative text-[#F17B2C]">
                Primary Features
                <span className="absolute bottom-0 left-0 h-1 w-full bg-[#F17B2C]"></span>
              </span>
            </div>
          </h1>
        </section>
      </div>

      {/* Feature Cards */}
      {features?.map((feature, index) => (
        <FeatureCard
          key={feature.tag}
          feature={feature}
          isReversed={index % 2 !== 0}
          background={
            feature.background ??
            `linear-gradient(180deg, ${
              ["#F3EEFC", "#EAF6FF", "#FFF3F3", "#F3FFF3"][index % 4]
            } 0%, #FFFFFF 100%)`
          }
        />
      ))}
    </section>
  )
}

export default FeaturesBlocks
