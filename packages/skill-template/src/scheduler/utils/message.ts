import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

export interface SkillPromptModule {
  buildSystemPrompt: (locale: string, needPrepareContext: boolean) => string;
  buildContextUserPrompt: (context: string, needPrepareContext: boolean) => string;
  buildUserPrompt: ({
    originalQuery,
    rewrittenQuery,
    locale,
  }: {
    originalQuery: string;
    rewrittenQuery: string;
    locale: string;
  }) => string;
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
  const contextUserPrompt = module.buildContextUserPrompt?.(context, needPrepareContext) || '';
  const userPrompt = module.buildUserPrompt({ originalQuery, rewrittenQuery, locale });

  const contextMessages = contextUserPrompt ? [new HumanMessage(contextUserPrompt)] : [];
 
  const requestMessages = [
    new SystemMessage(systemPrompt),
    ...chatHistory,
    ...messages,
    ...contextMessages,
    new HumanMessage(userPrompt),
  ];

  return requestMessages;
};
