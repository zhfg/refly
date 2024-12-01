import { z } from 'zod';

// Add structured data extraction utility

export async function extractStructuredData<T extends z.ZodType>(
  model: any,
  schema: T,
  prompt: string,
  maxRetries: number = 3,
): Promise<z.infer<T>> {
  let lastError = '';

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Add previous error to prompt if it exists
      const fullPrompt = lastError
        ? `${prompt}\n\nPrevious attempt failed with error: ${lastError}\nPlease try again.`
        : prompt;

      const structuredLLM = model.withStructuredOutput(schema, {
        includeRaw: true,
        name: schema.description ?? 'structured_output',
      });

      const result = await structuredLLM.invoke(fullPrompt);

      // Check if we have valid parsed data
      if (result.parsed) {
        return result.parsed;
      }

      lastError = 'Failed to parse structured output';
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error occurred';
    }
  }

  throw new Error(`Failed to extract structured data after ${maxRetries} attempts. Last error: ${lastError}`);
}
