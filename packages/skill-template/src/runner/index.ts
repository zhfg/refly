require('dotenv').config();
import { SearchAndAddResource } from '../templates/search-and-add-resource';

async function run() {
  const thread = { configurable: { thread_id: '4' } };
  for await (const event of await SearchAndAddResource.stream([['user', 'Refly 是什么？']], {
    ...thread,
    streamMode: 'values',
  })) {
    for (const v of event.values()) {
      console.log(v);
    }
  }
}

run();
