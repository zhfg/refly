import { ToolNode } from '@langchain/langgraph/prebuilt';

import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, BaseMessage } from '@langchain/core/messages';

import { SqliteSaver } from '@langchain/langgraph/checkpoint/sqlite';

import { START, END, MessageGraph } from '@langchain/langgraph';
import { BaseSkill } from '../../base';
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

class SearchAndAddResourceSkill extends BaseSkill {
  name = 'search_and_add_resource';

  description =
    'Search Knowledge Base, and add resource. Useful for when you need to answer questions about current events. Input should be a search query.';

  schema = z.object({
    query: z.string(),
  });

  async _call(input: typeof this.graphState): Promise<string> {
    const runnable = this.toRunnable();

    return await runnable.invoke(input);
  }

  constructor(engine: SkillEngine) {
    super(engine);
  }

  graphState = {};

  toRunnable() {
    const tools = [new DuckDuckGoSearch({ maxResults: 3 })];

    const model = new ChatOpenAI({ model: 'gpt-3.5-turbo', openAIApiKey: process.env.OPENAI_API_KEY }).bindTools(tools);

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

export default SearchAndAddResourceSkill;
