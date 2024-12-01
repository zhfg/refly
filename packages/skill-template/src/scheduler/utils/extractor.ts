import { z } from 'zod';

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(content: string): any {
  // Match content between ```json and ``` tags
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch?.[1]) {
    throw new Error('No JSON content found in markdown');
  }

  try {
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    throw new Error('Failed to parse JSON from markdown');
  }
}

export async function extractStructuredData<T extends z.ZodType>(
  model: any,
  schema: T,
  prompt: string,
  maxRetries: number = 3,
): Promise<z.infer<T>> {
  let lastError = '';

  for (let i = 0; i < maxRetries; i++) {
    try {
      const fullPrompt = lastError
        ? `${prompt}\n\nPrevious attempt failed with error: ${lastError}\nPlease try again.`
        : prompt;

      const structuredLLM = model.withStructuredOutput(schema, {
        includeRaw: true,
        name: schema.description ?? 'structured_output',
      });

      const result = await structuredLLM.invoke(fullPrompt);

      // First try to use parsed data if available
      if (result?.parsed) {
        return result.parsed;
      }

      // If parsed is not available, try to extract from raw content
      if (result?.raw?.content) {
        const extractedJson = extractJsonFromMarkdown(result.raw.content);
        // Validate extracted JSON against schema
        const validated = schema.parse(extractedJson);
        return validated;
      }

      lastError = 'Failed to extract structured output from both parsed and raw content';
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error occurred';
    }
  }

  throw new Error(`Failed to extract structured data after ${maxRetries} attempts. Last error: ${lastError}`);
}
