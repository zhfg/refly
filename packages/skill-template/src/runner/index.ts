require('dotenv').config();
import { SkillEngine } from 'src/engine';
import { getRunnable } from '../inventory';
import SummarySkill from 'src/templates/summary';

async function run(name: string) {
  const thread = { configurable: { thread_id: '4' } };
  const engine = new SkillEngine(console, {
    createResource: (user, req) => null,
    updateResource: (user, req) => null,
    createCollection: (user, req) => null,
    updateCollection: (user, req) => null,
  });
  const runnable = getRunnable(engine, name);
  for await (const event of await runnable.streamEvents(
    {
      query: 'Refly 是什么？',
    },
    {
      ...thread,
      // streamMode: 'values',
      version: 'v1',
    },
  )) {
    console.log(JSON.stringify(event));
    // for (const [key, val] of Object.entries(event)) {
    //   console.log('key: \n', key);
    //   console.log(`value: \n`, val);
    // }
  }
}

run('summary');
