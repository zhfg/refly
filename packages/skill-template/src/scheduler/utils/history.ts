import { ChatMessage } from '@langchain/core/messages';

export function distillHistoryByRules(rounds: ChatMessage[][]) {
  const lastRound = rounds.at(-2);
  if (lastRound && lastRound.some((msg) => msg.role === 'function')) {
    // 上一轮是 Function 调用, 不包含任何上下文
    rounds = rounds.slice(-1);
  } else {
    // 上一轮是闲聊, mask 之前的 function 输出
    rounds.forEach((round) => {
      round.forEach((msg) => {
        if (msg.role === 'function') {
          msg.content = '<!-- The function output was omitted -->';
        }
      });
    });
  }
  return rounds;
}
