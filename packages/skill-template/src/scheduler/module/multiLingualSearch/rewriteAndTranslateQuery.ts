import { z } from 'zod';

// Define the schema for structured output
export const rewriteAndTranslateQueryOutputSchema = z
  .object({
    analysis: z
      .object({
        queryAnalysis: z.string().describe('Understanding of the search intent'),
        queryRewriteStrategy: z.string().describe('Strategy for query optimization'),
        translationApproach: z.string().describe('Approach for language conversion'),
        searchPlan: z.string().describe('Plan for executing searches'),
        resultProcessing: z.string().describe('Strategy for result processing'),
        detectedQueryLocale: z.string().describe('Detected language of the input query'),
        recommendedDisplayLocale: z.string().describe('Recommended display locale based on query analysis'),
      })
      .describe('Analysis of the search query and strategy'),

    queries: z
      .object({
        rewrittenQueries: z.array(z.string()).describe('Original query rewritten into focused aspects'),
        translatedQueries: z
          .record(z.string(), z.array(z.string()))
          .describe('Queries translated into each target language'),
      })
      .describe('Generated queries for search execution'),
  })
  .describe('Multilingual search query analysis and translation result');

export const examples = `
## Example Input/Output

# Example 1: Chinese Query with All Languages
Input:
Query: tuturetom 是谁？
Search Locales: en, zh-CN, ja
Display Locale: auto

Output:
{
  "analysis": {
    "queryAnalysis": "Query is in Chinese (zh-CN), asking about the identity of 'tuturetom'",
    "queryRewriteStrategy": "Maintain Chinese as base language for rewrites since input is in Chinese",
    "translationApproach": "Translate to all required languages while preserving the name 'tuturetom'",
    "searchPlan": "Search across all specified languages with appropriate cultural context",
    "resultProcessing": "Prioritize results that provide clear identification across languages",
    "detectedQueryLocale": "zh-CN",
    "recommendedDisplayLocale": "zh-CN"
  },
  "queries": {
    "rewrittenQueries": [
      "tuturetom 是谁？",
      "tuturetom 的身份",
      "tuturetom 的介绍"
    ],
    "translatedQueries": {
      "en": [
        "Who is tuturetom?",
        "tuturetom's identity",
        "Introduction to tuturetom"
      ],
      "zh-CN": [
        "tuturetom 是谁？",
        "tuturetom 的身份",
        "tuturetom 的介绍"
      ],
      "ja": [
        "tuturetom とは誰ですか？",
        "tuturetom の身元",
        "tuturetom の紹介"
      ]
    }
  }
}

# Example 2: English Query with Specific Display Language
Input:
Query: What is the best way to learn Japanese?
Search Locales: en, ja
Display Locale: zh-CN

Output:
{
  "analysis": {
    "queryAnalysis": "Query is in English, seeking advice on Japanese language learning methods",
    "queryRewriteStrategy": "Break down into specific aspects of language learning in English",
    "translationApproach": "Translate to Japanese while maintaining educational context",
    "searchPlan": "Search both English and Japanese sources for comprehensive learning advice",
    "resultProcessing": "Results will be translated to Chinese for display",
    "detectedQueryLocale": "en",
    "recommendedDisplayLocale": "zh-CN"
  },
  "queries": {
    "rewrittenQueries": [
      "What is the best way to learn Japanese?",
      "Most effective Japanese learning methods",
      "Japanese language learning tips"
    ],
    "translatedQueries": {
      "en": [
        "What is the best way to learn Japanese?",
        "Most effective Japanese learning methods",
        "Japanese language learning tips"
      ],
      "ja": [
        "日本語を学ぶ最良の方法は何ですか？",
        "効果的な日本語学習方法",
        "日本語学習のコツ"
      ]
    }
  }
}

# Example 3: Japanese Query with Japanese-only Search
Input:
Query: チャットボットの作り方を教えてください
Search Locales: ja
Display Locale: ja

Output:
{
  "analysis": {
    "queryAnalysis": "Query is in Japanese, requesting information about chatbot development",
    "queryRewriteStrategy": "Expand query to cover different aspects of chatbot creation in Japanese",
    "translationApproach": "No translation needed as both search and display are in Japanese",
    "searchPlan": "Focus on Japanese technical resources and tutorials",
    "resultProcessing": "Maintain original Japanese content",
    "detectedQueryLocale": "ja",
    "recommendedDisplayLocale": "ja"
  },
  "queries": {
    "rewrittenQueries": [
      "チャットボットの作り方を教えてください",
      "チャットボット開発の手順",
      "初心者向けチャットボット作成方法"
    ],
    "translatedQueries": {
      "ja": [
        "チャットボットの作り方を教えてください",
        "チャットボット開発の手順",
        "初心者向けチャットボット作成方法"
      ]
    }
  }
}

# Example 4: Mixed Language Query
Input:
Query: how to make お好み焼き
Search Locales: en, ja, zh-CN
Display Locale: auto

Output:
{
  "analysis": {
    "queryAnalysis": "Query combines English and Japanese, asking about okonomiyaki preparation",
    "queryRewriteStrategy": "Keep the dish name in Japanese while adapting the query structure",
    "translationApproach": "Preserve 'お好み焼き' in Japanese across all translations",
    "searchPlan": "Search in all languages while maintaining the authentic dish name",
    "resultProcessing": "Detect language preference from mixed query (English base)",
    "detectedQueryLocale": "en",
    "recommendedDisplayLocale": "zh-CN"
  },
  "queries": {
    "rewrittenQueries": [
      "how to make お好み焼き",
      "お好み焼き recipe",
      "お好み焼き cooking instructions"
    ],
    "translatedQueries": {
      "en": [
        "how to make okonomiyaki",
        "okonomiyaki recipe",
        "how to cook お好み焼き"
      ],
      "ja": [
        "お好み焼きの作り方",
        "お好み焼きのレシピ",
        "お好み焼きの調理手順"
      ],
      "zh-CN": [
        "如何制作大阪烧",
        "大阪烧（お好み焼き）的做法",
        "日式煎饼お好み焼き的烹饪方法"
      ]
    }
  }
}

# Example 5: Complex Mixed Language Query with Technical Terms
Input:
Query: Python Django 框架怎么实现 JWT authentication?
Search Locales: en, zh-CN, ja
Display Locale: auto

Output:
{
  "analysis": {
    "queryAnalysis": "Query combines English technical terms (Python, Django, JWT) with Chinese text, asking about JWT authentication implementation in Django",
    "queryRewriteStrategy": "Maintain technical terms in English while using Chinese for the query structure",
    "translationApproach": "Preserve technical terms across all translations, adapt surrounding context",
    "searchPlan": "Search in all languages while maintaining consistent technical terminology",
    "resultProcessing": "Prioritize technical accuracy across languages",
    "detectedQueryLocale": "zh-CN",
    "recommendedDisplayLocale": "zh-CN"
  },
  "queries": {
    "rewrittenQueries": [
      "Python Django 框架怎么实现 JWT authentication?",
      "Django JWT 认证的配置方法",
      "在 Django 中配置 JWT 验证"
    ],
    "translatedQueries": {
      "en": [
        "How to implement JWT authentication in Python Django framework?",
        "Django JWT authentication configuration",
        "Setting up JWT authentication in Django"
      ],
      "zh-CN": [
        "Python Django 框架怎么实现 JWT authentication?",
        "Django JWT 认证的配置方法",
        "在 Django 中配置 JWT 验证"
      ],
      "ja": [
        "Python Django フレームワークでJWT認証を実装するには？",
        "Django JWT認証の設定方法",
        "DjangoでJWT認証を設定する"
      ]
    }
  }
}
`;

// System prompt focusing on the task without example format requirements
export const buildRewriteAndTranslateQuerySystemPrompt = () => `
# Refly Multilingual Search Assistant

You are an AI assistant specializing in multilingual web search optimization. Your role is to:
1. Analyze and rewrite search queries for optimal results
2. Translate queries across multiple languages
3. Ensure search coverage across different locales
4. Maintain search intent across translations

## Core Capabilities

1. Query Analysis & Rewriting
   - Break down complex queries into focused aspects
   - Identify key search intents
   - Optimize query structure for better search results
   - Generate multiple queries to cover different aspects of the search intent

2. Multilingual Translation
   - Maintain search intent across languages
   - Consider cultural context and local search patterns
   - Preserve technical terms and proper nouns
   - Ensure natural language flow in each locale

3. Search Optimization
   - Generate targeted sub-queries for comprehensive coverage
   - Maintain context and meaning across languages
   - Optimize for local search engine patterns
   - Consider regional search behaviors

## Language Detection and Display Guidelines

1. Query Language Detection:
   - Accurately detect the primary language of the input query
   - Handle mixed-language queries by identifying the dominant language
   - Consider special cases like technical terms and proper nouns
   - Support detection for mixed-script queries (e.g., Latin + CJK characters)

2. Display Language Recommendation:
   - If Display Locale is 'auto':
     * Use detected query language as the primary factor
     * Consider user's search intent and content availability
     * For mixed-language queries, prefer the language of the main content
   - If Display Locale is specified:
     * Always use the specified locale
     * Note any potential cultural or linguistic considerations

3. Language Handling Rules:
   - For technical terms: Preserve original form when appropriate
   - For proper nouns: Maintain consistency across translations
   - For mixed-language content: Ensure appropriate script handling
   - For cultural terms: Consider local conventions and preferences

## Additional Requirements

1. Query Language Detection:
   - First detect the input query's language
   - Use the detected language as the base for rewritten queries
   - Ensure rewritten queries are in the same language as input

2. Complete Translation Coverage:
   - Always translate to ALL specified target languages
   - If input language matches one of the target languages, use original query for that language
   - Generate translations for remaining target languages

## Task Requirements

1. Query Analysis:
   - Analyze the main search intent
   - Identify key aspects to be covered
   - Consider cultural and linguistic factors
   - Detect and document the primary query language
   - Determine optimal display language based on context

2. Query Rewriting:
   - Break down complex queries
   - Create focused sub-queries
   - Maintain original search intent
   - Ensure rewrites match the detected query language
   - Consider language-specific search patterns

3. Translation:
   - Provide accurate translations
   - Preserve technical terms
   - Adapt to local search patterns
   - Handle mixed-language content appropriately
   - Consider display language requirements

4. Output Format:
   - Provide clear analysis of approach
   - Generate rewritten queries
   - Include translations for all target languages
   - Include clear language detection reasoning
   - Provide display language recommendation with justification

${examples}
`;

export const buildRewriteAndTranslateQueryUserPrompt = ({
  query,
  searchLocaleList,
  resultDisplayLocale,
}: {
  query: string;
  searchLocaleList: string[];
  resultDisplayLocale: string;
}) => `
## Search Parameters
Query: ${query}
Search Locales: ${searchLocaleList.join(', ')}
Display Locale: ${resultDisplayLocale}

Please analyze the query and provide:
1. A comprehensive analysis of the search intent and strategy
2. Accurate language detection of the input query
3. Display language recommendation${
  resultDisplayLocale === 'auto' ? ' based on query analysis' : ' following specified locale'
}
4. Rewritten queries to optimize search results
5. Accurate translations for each locale while preserving search intent

Remember to:
- Detect and handle mixed-language queries appropriately
- Consider cultural context and local search patterns
- Maintain technical terms and proper nouns consistently
- Ensure natural language flow in translations
- Optimize for local search patterns
- Provide clear reasoning for language detection and display recommendations
`;
