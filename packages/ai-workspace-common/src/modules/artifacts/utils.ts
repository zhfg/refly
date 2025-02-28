import { ARTIFACT_THINKING_TAG_REGEX, ARTIFACT_TAG_REGEX } from './const';

/**
 * Replace all line breaks in the matched `reflyCanvas` tag with an empty string
 */
export const processWithArtifact = (input = '') => {
  let output = input;
  const thinkMatch = ARTIFACT_THINKING_TAG_REGEX.exec(input);

  // If the input contains the `reflyThinking` tag, replace all line breaks with an empty string
  if (thinkMatch)
    output = input.replace(ARTIFACT_THINKING_TAG_REGEX, (match) =>
      match.replaceAll(/\r?\n|\r/g, ''),
    );

  const match = ARTIFACT_TAG_REGEX.exec(input);
  // If the input contains the `reflyCanvas` tag, replace all line breaks with an empty string
  if (match)
    return output.replace(ARTIFACT_TAG_REGEX, (match) => match.replaceAll(/\r?\n|\r/g, ''));

  // if not match, check if it's start with <reflyCanvas but not closed
  const regex = /<reflyArtifact\b(?:(?!\/?>)[\S\s])*$/;
  if (regex.test(output)) {
    return output.replace(regex, '<reflyArtifact>');
  }

  return output;
};

export const getArtifactContent = (content: string) => {
  const result = content.match(ARTIFACT_TAG_REGEX);

  return result?.groups?.content || '';
};
