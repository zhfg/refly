import { ToolNode } from '@langchain/langgraph/prebuilt';

import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';
import { AIMessage, BaseMessage } from '@langchain/core/messages';

import { SqliteSaver } from '@langchain/langgraph/checkpoint/sqlite';

import { START, END, MessageGraph } from '@langchain/langgraph';
import { BaseSkill, baseStateGraphArgs } from '../../base';
import { SkillEngine } from '../../engine';

// schema
import { z } from 'zod';

// Define the function that determines whether to continue or not
function shouldContinue(messages: BaseMessage[]): 'action' | typeof END {
  const lastMessage = messages[messages.length - 1];

  // If there is no function call, then we finish
  if (!(lastMessage as AIMessage)?.tool_calls || (lastMessage as AIMessage)?.tool_calls?.length === 0) {
    return END;
  } else {
    return 'action';
  }
}

// Define a new graph

export class SearchAndAddResourceSkill extends BaseSkill {
  name = 'search_and_add_resource';

  displayName = {
    en: 'Search and Add Resource',
    'zh-CN': '搜索并添加资源',
  };

  description = 'Search for a given topic, and add to Refly knowledge base.';

  schema = z.object({
    query: z.string(),
  });

  constructor(engine: SkillEngine) {
    super(engine);
  }

  graphState = baseStateGraphArgs;

  toRunnable() {
    const tools = [new DuckDuckGoSearch({ maxResults: 3 })];

    const model = this.engine.chatModel().bindTools(tools);

    const workflow = new MessageGraph().addNode('agent', model).addNode('action', new ToolNode<BaseMessage[]>(tools));

    workflow.addEdge(START, 'agent');
    // Conditional agent -> action OR agent -> END
    workflow.addConditionalEdges('agent', shouldContinue);
    // Always transition `action` -> `agent`
    workflow.addEdge('action', 'agent');

    const memory = SqliteSaver.fromConnString(':memory:'); // Here we only save in-memory

    // Setting the interrupt means that any time an action is called, the machine will stop
    // export const SearchAndAddResource = workflow.compile({ checkpointer: memory, interruptBefore: ['action'] });
    return workflow.compile({ checkpointer: memory });
  }
}
