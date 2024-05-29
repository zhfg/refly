// 信息抽取使用 function call 技术

import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { categoryList } from './utils/category';
import { makeChatFewshotExamples } from './utils/common';

// Add more example for performance optimization
// TODO: compatible with function call message sequence: human/function/ai msg
export const fewshotExamples = [
  new HumanMessage({
    content: `summary: 这篇论文探讨了生成式对抗网络（GAN）在图像生成中的应用。
  keyword: GAN，图像生成,人工智能，研究，论文`,
  }),
  new AIMessage({
    content: `\`\`\`ts
  {
    categoryId: "generative_ai_research",
    reason: "此文本主要关乎生成式AI的研究，特别是在图像生成方面的探讨。关键词包括'GAN'、'图像生成'和'人工智能'，都是生成式AI研究领域的专属语言。因此，根据这些信息，此文本最适合归为'生成式AI研究'类别。",
    score: 0.9,
    format: "text",
  }
  \`\`\``,
  }),
];

export const systemPrompt = `
# Role
You are a sharp expert in textual content classification, proficient in identifying textual information and categorizing it correctly. Your sole task is to interpret the text, provide the corresponding classification, and justify the categorization.

## Skills
### Skill 1: Text Content Classification
- Identify the textual content and keywords provided by the user.
- Determine the appropriate category based on the content and keywords.
- Interpret and analyze the information to output the categorization labels.

### Skill 2: Understanding Classification Criteria
- Comprehend different classification lists and their descriptions.
- Integrate the understanding of connections and distinctions between categories to perform accurate categorization.

### Skill 3: Explaining Classification Basis
- Provide sufficient reasons for the categorization results of the text.
- Craft clear and well-grounded explanations to enable users to understand why the text falls into a specific category.

## Constraints:
- Discussion should be limited to the classification of textual content.
- Ensure that all classifications adhere to the provided classification list.
- Explanations and reasons for each categorization should be within 100 words.
- Utilize content from the knowledge base. For unknown texts, conduct searches and browse for information.

## Context Supplement

### Input format

===
summary: string;
keyword: string;
===

### category list

\`\`\`json
${JSON.stringify(categoryList)}
\`\`\`

### Output format

\`\`\`ts
interface OutputFormat {
  categoryId: string; // category id
  reason: string; // judge this category reason
  score: number; // Determine the percentage assigned to this category. The value range is 0-1, such as 0.8, which means it belongs to this category to a large extent.
  format: string; // Website content type, eg. Youtube is a video content type website; Medium is a text content type website
}
\`\`\`

## Examples

${makeChatFewshotExamples(fewshotExamples)}
`;

// The category extractor schema
export const extractContentMetaSchema = {
  name: 'content_category_extractor',
  description: `extract category`,
  parameters: {
    type: 'object',
    properties: {
      categoryId: {
        type: 'string',
        enum: categoryList.map((item) => item.id),
        description: `category id`,
      },
      reason: {
        type: 'string',
        describe: 'the reason to judge content belong to this category',
      },
      score: {
        type: 'number',
        describe:
          'Determine the percentage assigned to this category. The value range is 0-1, such as 0.8, which means it belongs to this category to a large extent.',
      },
      format: {
        type: 'string',
        enum: ['text', 'image', 'video'],
        describe:
          'Website content type, eg. Youtube is a video content type website; Medium is a text content type website',
      },
    },
    required: ['categoryId', 'reason', 'score', 'format'],
  },
};

export const extractSearchKeyword = {
  name: 'keyword_for_search_engine',
  description: `You are an expert search engine keywords extraction algorithm.
    Only extract keyword from the user query for search engine. If cannot extract keywords, the results should be empty array`,
  parameters: {
    type: 'object',
    properties: {
      keyword_list: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['keyword_list'],
  },
};
