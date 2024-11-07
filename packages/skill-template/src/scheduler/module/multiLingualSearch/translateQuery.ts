import { z } from 'zod';

export const translateQueryOutputSchema = z
  .object({
    translations: z
      .record(z.string(), z.array(z.string()))
      .describe('Queries translated into each target language')
      .default({})
      .refine(
        (translations) => Object.values(translations).every((queries) => queries.length > 0),
        'Each language must have at least one query',
      ),
  })
  .describe('Query translation results');

export const buildTranslateQuerySystemPrompt = () => `
# Query Translation Assistant

You are a specialized translation assistant focused on translating search queries accurately while preserving their intent and technical terms.

## Your Task
Translate the provided source queries into all specified target languages.

## Key Requirements
1. MUST output valid JSON with the exact structure:
{
  "translations": {
    "locale1": ["query1", "query2"],
    "locale2": ["query1", "query2"]
  }
}

2. MUST include translations for ALL target locales
3. MUST preserve technical terms in their original form
4. MUST maintain search intent and meaning

## Translation Rules
1. Technical Terms
   - Keep programming terms (e.g., Python, Django, JWT) unchanged
   - Use standard technical term translations when they exist

2. Query Structure
   - Maintain the basic structure of each query
   - Adapt to target language word order
   - Keep queries concise and searchable

3. Language Specifics
   - Use natural expressions in each target language
   - Follow target language grammar rules
   - Maintain formal/technical tone

## Example
Input:
{
  "queries": ["How to implement JWT in Django?"],
  "sourceLocale": "en",
  "targetLocales": ["zh-CN", "ja"]
}

Output:
{
  "translations": {
    "zh-CN": ["如何在 Django 中实现 JWT？"],
    "ja": ["Django で JWT を実装する方法"]
  }
}

Remember: Always output complete, valid JSON with all required translations.`;

export const buildTranslateQueryUserPrompt = ({
  queries: rewrittenQueries,
  searchLocaleList,
  sourceLocale,
}: {
  queries: string[];
  searchLocaleList: string[];
  sourceLocale: string;
}) => `
## Translation Request

Source Queries: ${JSON.stringify(rewrittenQueries)}
Source Language: ${sourceLocale}
Target Languages: ${searchLocaleList.join(', ')}

Instructions:
1. Translate each query to ALL target languages
2. Keep technical terms unchanged (e.g., Python, Django, JWT)
3. Ensure natural expression in each language
4. Maintain search intent and meaning

Required Output Format:
{
  "translations": {
    ${searchLocaleList.map((locale) => `"${locale}": ["translated query 1", "translated query 2"]`).join(',\n    ')}
  }
}

Note: Ensure ALL target languages are included in the output.`;
