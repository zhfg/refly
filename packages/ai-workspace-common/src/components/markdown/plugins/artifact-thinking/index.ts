import { ARTIFACT_THINKING_TAG } from '@refly-packages/ai-workspace-common/modules/artifacts/const';

import Component from './render';
import rehypePlugin from './rehypePlugin';

const ReflyThinkingElement = {
  Component,
  rehypePlugin,
  tag: ARTIFACT_THINKING_TAG,
};

export default ReflyThinkingElement;
