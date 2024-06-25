require('dotenv').config();
import { SkillEngine } from 'src/engine';
import SearchAndAddResource from '../templates/ai-search-engine';

async function run() {
  const thread = { configurable: { thread_id: '4' } };
  const engine = new SkillEngine(console, {
    createResource: (user, req) => null,
    updateResource: (user, req) => null,
    createCollection: (user, req) => null,
    updateCollection: (user, req) => null,
  });
  const skill = new SearchAndAddResource(engine);
  const runnable = skill.toRunnable();
  for await (const event of await runnable.stream(
    {
      userQuery: 'Refly 是什么？',
    },
    {
      ...thread,
      // streamMode: 'values',
    },
  )) {
    for (const [key, val] of Object.entries(event)) {
      //   console.log('key: \n', key);
      //   console.log(`value: \n`, val);
    }
  }
}

// run();
