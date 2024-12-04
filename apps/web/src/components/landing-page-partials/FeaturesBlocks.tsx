import React from "react"

// Feature type definition for better type safety
interface Feature {
  tag: string
  title: string
  description: string
  bulletPoints: string[]
  imageSrc: string
}

interface FeatureCardProps {
  isReversed?: boolean
  background?: string
}

function FeaturesBlocks() {
  // Sample feature data
  const feature: Feature = {
    tag: "Features",
    title: "An Overview of Refly's Primary Features",
    description: "头脑风暴、梳理大纲、将想法转为可落地的行动",
    bulletPoints: [
      "20+ 场景，适配学术论文、竞品调研、技术文章、自媒体撰文、项目、OKR",
      "AI 一键生成内容大纲",
      "基于历史知识进行推荐、关联记忆",
    ],
    imageSrc: "https://static.refly.ai/landing/hero-image.png",
  }

  const FeatureCard = ({
    isReversed = false,
    background = "linear-gradient(180deg, #F3EEFC 0%, #FFFFFF 100%)",
  }: FeatureCardProps) => (
    <div className="relative mx-auto mt-[48px] w-full md:w-[71.88%]">
      <div
        className="min-h-[400px] w-full overflow-visible rounded-[20px] md:h-[694px]"
        style={{
          background,
          border: "1px solid rgba(0, 0, 0, 0.05)",
        }}>
        <div
          className={`flex h-full flex-col gap-8 p-8 md:flex-row ${isReversed ? "md:flex-row-reverse" : ""}`}>
          {/* Image Section - Updated for responsive design */}
          <div className="relative h-[300px] md:h-auto md:w-1/2">
            <img
              src={feature?.imageSrc}
              alt="Feature visualization"
              className="absolute h-full w-[133%] object-contain"
              style={{
                [isReversed ? "right" : "left"]: "-33%",
                borderRadius: "20px",
                // boxShadow: "0px 3px 20px 0px rgba(0, 0, 0, 0.1)",
                opacity: 1,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Content Section */}
          <div className="flex flex-col justify-center md:w-1/2">
            <span className="mb-4 inline-block w-fit rounded-md bg-white px-4 py-1 text-sm font-medium shadow-sm">
              {feature?.tag}
            </span>
            <h2 className="mb-4 text-3xl font-bold">{feature?.description}</h2>
            <ul className="space-y-4">
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

  return (
    <section className="mt-[98px] px-6 sm:px-6 md:px-6 lg:px-0">
      {/* Header Section */}
      <div className="mb-16 text-center">
        <span className="mb-8 inline-block rounded-md bg-white px-6 py-2 text-sm font-medium shadow-sm">
          {feature.tag}
        </span>
        <h1 className="mb-6 text-4xl font-bold md:text-5xl">{feature.title}</h1>
      </div>
      {/* Feature Cards with different backgrounds */}
      <FeatureCard
        isReversed={false}
        background="linear-gradient(180deg, #F3EEFC 0%, #FFFFFF 100%)"
      />
      <FeatureCard
        isReversed={true}
        background="linear-gradient(180deg, #EAF6FF 0%, #FFFFFF 100%)"
      />
      <FeatureCard
        isReversed={false}
        background="linear-gradient(180deg, #FFF3F3 0%, #FFFFFF 100%)"
      />
      <FeatureCard
        isReversed={true}
        background="linear-gradient(180deg, #F3FFF3 0%, #FFFFFF 100%)"
      />
    </section>
  )
}

export default FeaturesBlocks
