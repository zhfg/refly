import { CANVAS_THINKING_TAG_REGEX, CANVAS_TAG_REGEX } from '@refly-packages/ai-workspace-common/constants/canvas';

/**
 * Replace all line breaks in the matched `reflyCanvas` tag with an empty string
 */
export const processWithCanvas = (input: string = '') => {
  let output = input;
  const thinkMatch = CANVAS_THINKING_TAG_REGEX.exec(input);

  // If the input contains the `reflyThinking` tag, replace all line breaks with an empty string
  if (thinkMatch) output = input.replace(CANVAS_THINKING_TAG_REGEX, (match) => match.replaceAll(/\r?\n|\r/g, ''));

  const match = CANVAS_TAG_REGEX.exec(input);
  // If the input contains the `reflyCanvas` tag, replace all line breaks with an empty string
  if (match) return output.replace(CANVAS_TAG_REGEX, (match) => match.replaceAll(/\r?\n|\r/g, ''));

  // if not match, check if it's start with <reflyCanvas but not closed
  const regex = /<reflyCanvas\b(?:(?!\/?>)[\S\s])*$/;
  if (regex.test(output)) {
    return output.replace(regex, '<reflyCanvas>');
  }

  return output;
};

export const getCanvasContent = (content: string) => {
  const result = content.match(CANVAS_TAG_REGEX);

  return result?.groups?.content || '';
};
