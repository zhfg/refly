import { HumanMessage } from '@langchain/core/messages';
import { ChatMessage } from '@langchain/core/messages';

export function followUpQueryPrompt(previousRounds: ChatMessage[][], currentUserInput: string) {
  const history = previousRounds
    .map((round) =>
      round
        .filter((m) => m.role !== 'function')
        .map((m) => {
          if (m.role === 'user') {
            return ['User:', m.content, '', 'Smart Assistant:'].join('\n');
          }
          if (m.role === 'assistant') {
            if (m.additional_kwargs.function_call) {
              return ` - 调用 ${m.name}`;
            }
            return m.content;
          }
        })
        .join('\n'),
    )
    .join('\n\n');

  return `# Task
  Judge whether the CurrentInput is dependent on the content of the Previous Conversation.
  1. Here are some examples of inputs that depend on the Previous Conversation:
    - 展开说说
    - 解释上面的结果
    - 上面数据的是怎么查出来的?
    - 你刚才执行的SQL是什么?
    - 重做一次
    - 把条件换成XXX再查一次 // Expansion based on previous input
  2. Topics similar to Previous Conversation may not necessarily be depend on the Previous Conversation.
  
  # Previous Conversation
  \`\`\`text
  ${history}
  \`\`\
  
  # CurrentInput
  \`\`\`text
  User:
  ${currentUserInput}
  \`\`\
  
  Please use the "report_result" to output the result. Do not output any irrelevant text.`;
}

export async function predictFollowUpQuery(prompt: string, model: any) {
  const resp = await model.predictMessages([new HumanMessage(prompt)], {
    timeout: 10000,
    functions: [
      {
        name: 'report_result',
        parameters: {
          type: 'object',
          properties: {
            is_dependent_on_previous_conversation: {
              type: 'boolean',
            },
          },
          required: ['is_dependent_on_previous_conversation'],
        },
      },
    ],
    function_call: {
      name: 'report_result',
    },
  });
  return JSON.parse(resp.additional_kwargs.function_call?.arguments || '{}').is_dependent_on_previous_conversation ===
    false
    ? false
    : true;
}
