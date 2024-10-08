import { GraphState, IContext } from '../types';
import {
  countContentTokens,
  countMentionedContextTokens,
  countNoteTokens,
  countResourceTokens,
  countToken,
} from './token';
import { ModelContextLimitMap } from './token';
import {
  processSelectedContentWithSimilarity,
  processNotesWithSimilarity,
  processResourcesWithSimilarity,
  processMentionedContextWithSimilarity,
} from './semanticSearch';
import { BaseSkill, SkillRunnableConfig } from '@/base';
import { truncateContext, truncateText } from './truncator';
import { concatContextToStr } from './summarizer';

// configurable params
const MAX_CONTEXT_RATIO = 0.7;
const MAX_SELECTED_CONTENT_RATIO = 2 / 4;
const MAX_NOTES_RATIO = 1 / 4;
const MAX_RESOURCES_RATIO = 1 / 4;

export async function prepareContext(
  {
    query,
    mentionedContext,
  }: {
    query: string;
    mentionedContext: IContext;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<string> {
  const {
    locale = 'en',
    chatHistory = [],
    modelName,
    contentList,
    resources,
    notes,
    collections,
  } = ctx.configSnapshot.configurable;
  const modelWindowSize = ModelContextLimitMap[modelName];
  const maxContextTokens = Math.floor(modelWindowSize * MAX_CONTEXT_RATIO);
  // TODO: think remainingTokens may out of range
  let remainingTokens = maxContextTokens;

  // TODO: web search context
  const processedWebSearchContext = await prepareWebSearchContext(
    {
      query,
    },
    ctx,
  );
  const webSearchContextTokens = 0;
  remainingTokens = maxContextTokens - webSearchContextTokens;

  // 2. mentioned context
  const { mentionedContextTokens, processedMentionedContext } = await prepareMentionedContext(
    {
      query,
      mentionedContext,
      maxMentionedContextTokens: remainingTokens,
    },
    ctx,
  );
  remainingTokens -= mentionedContextTokens;

  // 3. relevant context
  const { relevantContextTokens, processedRelevantContext } = await prepareRelevantContext(
    {
      query,
      maxRelevantContextTokens: remainingTokens,
    },
    ctx,
  );

  let contextStr = '';
  if (webSearchContextTokens > 0) {
    contextStr += `### Web search context: \n`;
    contextStr += concatContextToStr(processedWebSearchContext);
  }
  if (mentionedContextTokens > 0) {
    contextStr += `### Mentioned context: \n`;
    contextStr += concatContextToStr(processedMentionedContext);
  }
  if (relevantContextTokens > 0) {
    contextStr += `### Relevant context: \n`;
    contextStr += concatContextToStr(processedRelevantContext);
  }

  return contextStr;
}

export async function prepareWebSearchContext(
  {
    query,
  }: {
    query: string;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<IContext> {
  const webSearchContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };

  return webSearchContext;
}

export async function prepareMentionedContext(
  {
    query,
    mentionedContext,
    maxMentionedContextTokens,
  }: {
    query: string;
    mentionedContext: IContext;
    maxMentionedContextTokens: number;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<{
  mentionedContextTokens: number;
  processedMentionedContext: IContext;
}> {
  const { locale = 'en', chatHistory = [], modelName } = ctx.configSnapshot.configurable;

  let processedMentionedContext: IContext = {
    contentList: [],
    resources: [],
    notes: [],
    collections: [],
  };

  const allMentionedContextTokens = countMentionedContextTokens(mentionedContext);

  let mentionedContextTokens = allMentionedContextTokens;
  if (allMentionedContextTokens > maxMentionedContextTokens) {
    processedMentionedContext = await processMentionedContextWithSimilarity(
      query,
      mentionedContext,
      maxMentionedContextTokens,
    );
    mentionedContextTokens = countMentionedContextTokens(processedMentionedContext);

    if (mentionedContextTokens > maxMentionedContextTokens) {
      processedMentionedContext = truncateContext(processedMentionedContext, maxMentionedContextTokens);
      mentionedContextTokens = countMentionedContextTokens(processedMentionedContext);
    }
  }

  return {
    mentionedContextTokens,
    processedMentionedContext,
  };
}

export async function prepareRelevantContext(
  {
    query,
    maxRelevantContextTokens,
  }: {
    query: string;
    maxRelevantContextTokens: number;
  },
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<{
  relevantContextTokens: number;
  processedRelevantContext: IContext;
}> {
  const {
    locale = 'en',
    chatHistory = [],
    modelName,
    contentList,
    resources,
    notes,
    collections,
  } = ctx.configSnapshot.configurable;

  // configurable params
  let remainingTokens = maxRelevantContextTokens;

  let relevantContexts: IContext = {
    contentList: [],
    resources: [],
    notes: [],
  };

  // all tokens
  const allSelectedContentTokens = countContentTokens(contentList);
  const allNotesTokens = countNoteTokens(notes);
  const allResourcesTokens = countResourceTokens(resources);

  // 3. selected content context
  let selectedContentTokens = allSelectedContentTokens;
  const selectedContentMaxTokens =
    remainingTokens - allNotesTokens - allResourcesTokens > MAX_SELECTED_CONTENT_RATIO * remainingTokens
      ? remainingTokens - allNotesTokens - allResourcesTokens
      : MAX_SELECTED_CONTENT_RATIO * remainingTokens;
  if (selectedContentTokens > selectedContentMaxTokens) {
    const relevantContentList = await processSelectedContentWithSimilarity(
      query,
      contentList,
      selectedContentMaxTokens,
    );
    relevantContexts.contentList.concat(...relevantContentList);
    selectedContentTokens = relevantContentList.reduce((sum, content) => sum + countToken(content?.content || ''), 0);
  } else {
    relevantContexts.contentList.concat(...contentList);
  }

  // 4. notes context
  // remainingTokens = maxContextTokens - selectedContentTokens;
  let notesTokens = allNotesTokens;
  const notesMaxTokens =
    remainingTokens - selectedContentTokens - allResourcesTokens > MAX_NOTES_RATIO * remainingTokens
      ? remainingTokens - selectedContentTokens - allResourcesTokens
      : MAX_NOTES_RATIO * remainingTokens;
  if (notesTokens > notesMaxTokens) {
    const relevantNotes = await processNotesWithSimilarity(query, notes, notesMaxTokens);
    relevantContexts.notes.concat(...relevantNotes);
    notesTokens = relevantNotes.reduce((sum, note) => sum + countToken(note?.note?.content || ''), 0);
  } else {
    relevantContexts.notes.concat(...notes);
  }

  // 5. resources context
  // remainingTokens = maxContextTokens - notesTokens;
  let resourcesTokens = allResourcesTokens;
  const resourcesMaxTokens =
    remainingTokens - selectedContentTokens - notesTokens > MAX_RESOURCES_RATIO * remainingTokens
      ? remainingTokens - selectedContentTokens - notesTokens
      : MAX_RESOURCES_RATIO * remainingTokens;
  if (resourcesTokens > resourcesMaxTokens) {
    const relevantResources = await processResourcesWithSimilarity(query, resources, resourcesMaxTokens);
    relevantContexts.resources.concat(...relevantResources);
    resourcesTokens = relevantResources.reduce(
      (sum, resource) => sum + countToken(resource?.resource?.content || ''),
      0,
    );
  } else {
    relevantContexts.resources.concat(...resources);
  }

  // 6. TODO: collections context, mainly for knowledge base search meat filter

  let totalTokens = selectedContentTokens + notesTokens + resourcesTokens;
  if (totalTokens > remainingTokens) {
    relevantContexts = truncateContext(relevantContexts, remainingTokens);
    totalTokens =
      countContentTokens(relevantContexts.contentList) +
      countNoteTokens(relevantContexts.notes) +
      countResourceTokens(relevantContexts.resources);
  }

  return {
    processedRelevantContext: relevantContexts,
    relevantContextTokens: totalTokens,
  };
}
