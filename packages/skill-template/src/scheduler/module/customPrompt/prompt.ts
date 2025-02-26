import { buildCitationReminder } from '../common/citationRules';

// For custom prompt, we'll use the user-provided system prompt directly
export const buildCustomPromptSystemPrompt = (
  customSystemPrompt: string,
  _locale: string,
  needPrepareContext: boolean,
) => {
  console.log('needPrepareContext', needPrepareContext);
  // If no context preparation is needed, just return the custom system prompt
  return customSystemPrompt;
};

export const buildCustomPromptUserPrompt = ({
  originalQuery,
  optimizedQuery,
  rewrittenQueries,
}: {
  originalQuery: string;
  optimizedQuery: string;
  rewrittenQueries: string[];
  locale?: string;
}) => {
  if (originalQuery === optimizedQuery) {
    return `## User Query
${originalQuery}
`;
  }

  return `## User Query

### Original User Query
${originalQuery}

### Optimized User Query
${optimizedQuery}

### Rewritten User Queries
${rewrittenQueries.map((query) => `- ${query}`).join('\n')}
`;
};

export const buildCustomPromptContextUserPrompt = (
  context: string,
  needPrepareContext: boolean,
) => {
  if (!needPrepareContext) {
    return '';
  }

  return `
## Context
${context}

${buildCitationReminder()}
`;
};
