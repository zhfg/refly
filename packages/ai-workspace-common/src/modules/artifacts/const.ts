export const ARTIFACT_TAG = 'reflyArtifact';
export const ARTIFACT_THINKING_TAG = 'reflyThinking';

// https://regex101.com/r/TwzTkf/2
export const ARTIFACT_TAG_REGEX =
  /<reflyArtifact\b[^>]*>(?<content>[\S\s]*?)(?:<\/reflyArtifact>|$)/;

// https://regex101.com/r/r9gqGg/1
export const ARTIFACT_TAG_CLOSED_REGEX = /<reflyArtifact\b[^>]*>([\S\s]*?)<\/reflyArtifact>/;

// https://regex101.com/r/AvPA2g/1
export const ARTIFACT_THINKING_TAG_REGEX =
  /<reflyThinking\b[^>]*>([\S\s]*?)(?:<\/reflyThinking>|$)/;

// Similar to ARTIFACT_TAG_CLOSED_REGEX but for reflyThinking
export const ARTIFACT_THINKING_TAG_CLOSED_REGEX =
  /<reflyThinking\b[^>]*>([\S\s]*?)<\/reflyThinking>/;
