import { AIMessage, HumanMessage } from 'langchain/schema';

// ChatCompletion fewshots
export const makeChatFewshotExamples = (
  examples: (HumanMessage | AIMessage)[],
) => {
  return examples.reduce((total, cur) => {
    if (cur?._getType() === 'human') {
      total += `\n- human: ${cur?.content}\n`;
    } else if (cur?._getType() === 'ai') {
      total += `\n- ai: ${cur?.content}\n`;
    }

    return total;
  }, '');
};

// 传统 TextCompletion fewshots
export const makeTextFewshotExample = (text) => {
  return text;
};
