import { CANVAS_TAG } from '@refly-packages/ai-workspace-common/constants/canvas';

import Component from './render';
import rehypePlugin from './rehypePlugin';

const ReflyCanvasElement = {
  Component,
  rehypePlugin,
  tag: CANVAS_TAG,
};

export default ReflyCanvasElement;
