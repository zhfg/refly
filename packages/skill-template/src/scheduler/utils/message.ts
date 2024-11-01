import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

export interface SkillPromptModule {
  buildSystemPrompt: (locale: string, needPrepareContext: boolean) => string;
  buildUserPrompt: ({ originalQuery, rewrittenQuery }: { originalQuery: string; rewrittenQuery: string }) => string;
}

export const buildFinalRequestMessages = ({
  module,
  locale,
  chatHistory,
  messages,
  needPrepareContext,
  context,
  originalQuery,
  rewrittenQuery,
}: {
  module: SkillPromptModule;
  locale: string;
  chatHistory: BaseMessage[];
  messages: BaseMessage[];
  needPrepareContext: boolean;
  context: string;
  originalQuery: string;
  rewrittenQuery: string;
}) => {
  const systemPrompt = module.buildSystemPrompt(locale, needPrepareContext);
  const contextPrompt = needPrepareContext ? `## Context \n ${context}` : '';
  const userPrompt = module.buildUserPrompt({ originalQuery, rewrittenQuery });

  // TODO: last check for token limit

  const requestMessages = [
    new SystemMessage(systemPrompt),
    ...chatHistory,
    ...messages, // TODO: for refractor scheduler to agent use case
    ...(needPrepareContext ? [new HumanMessage(contextPrompt)] : []),
    new HumanMessage(userPrompt),
  ];

  return requestMessages;
};
