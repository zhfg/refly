import { CANVAS_THINKING_TAG } from '@refly-packages/ai-workspace-common/constants/canvas';

import Component from './render';
import rehypePlugin from './rehypePlugin';

const ReflyThinkingElement = {
  Component,
  rehypePlugin,
  tag: CANVAS_THINKING_TAG,
};

export default ReflyThinkingElement;
