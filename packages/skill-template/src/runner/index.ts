require('dotenv').config();
import { SearchAndAddResource } from '../templates/ai-search-engine';

async function run() {
  const thread = { configurable: { thread_id: '4' } };
  for await (const event of await SearchAndAddResource.stream(
    {
      userQuery: 'Refly 是什么？',
    },
    {
      ...thread,
      streamMode: 'values',
    },
  )) {
    for (const [key, val] of Object.entries(event)) {
      //   console.log('key: \n', key);
      //   console.log(`value: \n`, val);
    }
  }
}

run();
