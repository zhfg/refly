// TODO: 将这里拆成 2 步，这个文件放第一步只做 rewrite，然后两个步骤并发
import { z } from 'zod';

// Define the schema for rewrite output
export const rewriteQueryOutputSchema = z
  .object({
    analysis: z
      .object({
        queryAnalysis: z.string().describe('Understanding of the search intent'),
        queryRewriteStrategy: z.string().describe('Strategy for query optimization'),
        detectedQueryLocale: z.string().describe('Detected language of the input query'),
        recommendedDisplayLocale: z.string().describe('Recommended display locale based on query analysis'),
      })
      .describe('Analysis of the search query'),

    queries: z
      .object({
        rewrittenQueries: z.array(z.string()).describe('Original query rewritten into focused aspects'),
      })
      .describe('Generated queries for search execution'),
  })
  .describe('Query analysis and rewrite result');

export const examples = `
## Example Input/Output

# Example 1: Chinese Query with Mixed Language
Input:
Query: Python Django 框架怎么实现 JWT authentication?
Display Locale: auto

Output:
{
  "analysis": {
    "queryAnalysis": "Technical query combining Chinese text with English terms, asking about JWT authentication implementation in Django framework",
    "queryRewriteStrategy": "Maintain technical terms while optimizing the query structure in Chinese",
    "detectedQueryLocale": "zh-CN",
    "recommendedDisplayLocale": "zh-CN"
  },
  "queries": {
    "rewrittenQueries": [
      "Python Django 框架实现 JWT authentication",
      "Django JWT 认证的配置方法",
      "Django 框架的身份验证实现"
    ]
  }
}

# Example 2: English Query with Specific Display Language
Input:
Query: What is the best way to learn Japanese?
Display Locale: zh-CN

Output:
{
  "analysis": {
    "queryAnalysis": "English query seeking advice on Japanese language learning methods",
    "queryRewriteStrategy": "Break down into specific aspects of language learning",
    "detectedQueryLocale": "en",
    "recommendedDisplayLocale": "zh-CN"
  },
  "queries": {
    "rewrittenQueries": [
      "What is the best way to learn Japanese?",
      "Most effective Japanese learning methods",
      "Japanese language learning tips and strategies"
    ]
  }
}`;

export const buildRewriteQuerySystemPrompt = () => `
# Query Analysis and Rewrite Assistant

## Core Capabilities
1. Query Analysis
   - Understand main search intent
   - Identify key aspects to cover
   - Consider cultural and linguistic factors
   - Handle technical and domain-specific terms

2. Language Detection
   - Accurately detect primary query language
   - Handle mixed-language queries
   - Consider technical terms and proper nouns
   - Support mixed-script detection (Latin + CJK)

3. Display Language Recommendation
   - If Display Locale is 'auto':
     * Use detected query language as primary factor
     * Consider search intent and content availability
     * Handle mixed-language queries appropriately
   - If Display Locale is specified:
     * Validate and use specified locale
     * Note any potential linguistic considerations

4. Query Rewriting
   - Break down complex queries
   - Generate focused sub-queries
   - Maintain original search intent
   - Optimize for search effectiveness
   - Preserve technical terms

## Language Handling Rules
1. Technical Terms
   - Preserve original form when appropriate
   - Maintain consistency across rewrites
   - Consider industry standard terminology

2. Mixed Language Content
   - Identify primary language
   - Handle technical terms appropriately
   - Ensure proper script handling

3. Cultural Terms
   - Consider local conventions
   - Maintain cultural context
   - Respect regional preferences

## Output Format
1. Analysis Section
   - Clear query intent analysis
   - Detailed rewrite strategy
   - Language detection reasoning
   - Display locale recommendation

2. Queries Section
   - Multiple focused rewrites
   - Preserved technical terms
   - Optimized search patterns

${examples}`;

export const buildRewriteQueryUserPrompt = ({
  query,
  resultDisplayLocale,
}: {
  query: string;
  resultDisplayLocale: string;
}) => `
## Search Parameters
Query: ${query}
Display Locale: ${resultDisplayLocale}

Please provide a comprehensive analysis including:
1. Query Intent Analysis
   - Main search purpose
   - Key concepts and terms
   - Technical or domain context

2. Language Detection
   - Primary language identification
   - Mixed language handling
   - Technical term consideration

3. Display Language Recommendation${
  resultDisplayLocale === 'auto'
    ? '\n   - Based on query analysis\n   - Consider content availability\n   - Account for mixed language content'
    : '\n   - Following specified locale: ' + resultDisplayLocale
}

4. Optimized Search Queries
   - Multiple focused aspects
   - Key concept variations
   - Search pattern optimization

Remember to:
- Handle mixed-language content appropriately
- Preserve technical terms and proper nouns
- Consider search engine patterns
- Maintain query intent across rewrites
- Provide clear reasoning for language decisions
- Optimize for search effectiveness
`;
