import { BaseSkill, SkillRunnableConfig } from '@/base';
import { GraphState } from '@/scheduler/types';
import { SearchResultContext, SerperSearch } from '@/tools/serper-online-search';
import { Source } from '@refly/openapi-schema';

export const webSearch = async (
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
) => {
  const { locale = 'en' } = ctx.configSnapshot.configurable;

  // 1. Search online
  const tool = new SerperSearch({ searchOptions: { maxResults: 8, locale }, engine: ctx.ctxThis.engine });
  ctx.ctxThis.emitEvent(
    {
      event: 'log',
      content: `Start calling ${tool.name} with args: ${JSON.stringify({
        query,
        locale,
      })}`,
    },
    ctx.configSnapshot,
  );
  const output = await tool.invoke({ query }, ctx.configSnapshot);
  ctx.ctxThis.emitEvent(
    {
      event: 'log',
      content: `Finished calling ${tool.name}`,
    },
    ctx.configSnapshot,
  );

  // 2. Shape context
  const releventDocs: SearchResultContext[] = JSON.parse(output) || [];
  const sources: Source[] = releventDocs.map((item) => ({
    url: item.url,
    title: item.name,
    pageContent: item.snippet,
  }));

  return sources;
};
