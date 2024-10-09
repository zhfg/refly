require('dotenv').config();
import { SkillEngine } from 'src/engine';
import { EventEmitter } from 'node:events';
import { Scheduler } from '../scheduler';
import { SkillEventMap } from '../base';

process.env.LANGCHAIN_CALLBACKS_BACKGROUND = 'true';
process.env.LANGCHAIN_TRACING_V2 = 'true';
process.env.LANGCHAIN_PROJECT = 'Refly Skill Runner';

async function run() {
  const emitter = new EventEmitter<SkillEventMap>();
  emitter.on('start', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_start: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });
  emitter.on('log', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_log: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });
  emitter.on('structured_data', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_structured_data: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });
  emitter.on('end', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_end: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });

  const engine = new SkillEngine(console, {
    getNoteDetail: async (user, noteId) => null,
    createNote: async (user, req) => null,
    listNotes: async (user, param) => null,
    getResourceDetail: async (user, req) => null,
    createResource: async (user, req) => null,
    updateResource: async (user, req) => null,
    createCollection: async (user, req) => null,
    updateCollection: async (user, req) => null,
    createLabelClass: async (user, req) => null,
    createLabelInstance: async (user, req) => null,
    webSearch: async (user, req) => null,
    search: async (user, req, options) => null,
  });
  // const runnable = getRunnable(engine, name);
  const skill = new Scheduler(engine);
  const runnable = skill.toRunnable();
  for await (const event of runnable.streamEvents(
    {
      query: 'hello',
    },
    {
      configurable: { locale: 'zh-CN', emitter },
      version: 'v2',
    },
  )) {
    // if (event.event === 'on_chat_model_end') {
    // }
    console.log(JSON.stringify(event, null, 2));
    console.log('------------------------------------');
    // for (const [key, val] of Object.entries(event)) {
    //   console.log('key: \n', key);
    //   console.log(`value: \n`, val);
    // }
  }
}

run();
