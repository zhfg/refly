import { ARTIFACT_TAG } from '@refly-packages/ai-workspace-common/modules/artifacts/const';

import Component from './render';
import rehypePlugin from './rehypePlugin';

type ArtifactElement = {
  Component: typeof Component;
  rehypePlugin: typeof rehypePlugin;
  tag: string;
};

const ReflyArtifactElement: ArtifactElement = {
  Component,
  rehypePlugin,
  tag: ARTIFACT_TAG,
};

export default ReflyArtifactElement;
