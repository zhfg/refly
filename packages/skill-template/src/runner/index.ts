require('dotenv').config();
import { SkillEngine } from 'src/engine';
import { SkillName } from '../inventory';
import { EventEmitter } from 'node:events';
import { Scheduler } from '../scheduler';
import { SkillEventMap } from '../base';

process.env.LANGCHAIN_CALLBACKS_BACKGROUND = 'true';
process.env.LANGCHAIN_TRACING_V2 = 'true';
process.env.LANGCHAIN_PROJECT = 'Refly Skill Runner';

async function run(name: SkillName) {
  const emitter = new EventEmitter<SkillEventMap>();
  emitter.on('on_skill_start', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_start: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });
  emitter.on('on_skill_stream', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_stream: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });
  emitter.on('on_skill_end', (data) => {
    console.log('------------------------------------');
    console.log(`on_skill_end: ${JSON.stringify(data, null, 2)}`);
    console.log('------------------------------------');
  });

  const engine = new SkillEngine(console, {
    createResource: (user, req) => null,
    updateResource: (user, req) => null,
    createCollection: (user, req) => null,
    updateCollection: (user, req) => null,
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

run('SummarySkill');
