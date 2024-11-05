import type { Node } from 'unist';
import { visit, SKIP } from 'unist-util-visit';

import { CANVAS_THINKING_TAG } from '@refly-packages/ai-workspace-common/constants/canvas';

// eslint-disable-next-line unicorn/consistent-function-scoping
const rehypePlugin = () => (tree: Node) => {
  visit(tree, 'element', (node: any, index, parent) => {
    if (node.type === 'element' && node.tagName === 'p') {
      const children = node.children || [];
      const openTagIndex = children.findIndex(
        (child: any) => child.type === 'raw' && child.value === `<${CANVAS_THINKING_TAG}>`,
      );
      const closeTagIndex = children.findIndex(
        (child: any) => child.type === 'raw' && child.value === `</${CANVAS_THINKING_TAG}>`,
      );

      if (openTagIndex !== -1) {
        // 有闭合标签的情况
        if (closeTagIndex !== -1 && closeTagIndex > openTagIndex) {
          const content = children.slice(openTagIndex + 1, closeTagIndex);
          const reflyThinkingNode = {
            children: content,
            properties: {},
            tagName: CANVAS_THINKING_TAG,
            type: 'element',
          };

          // Replace the entire paragraph with our new reflyThinking node
          parent.children.splice(index, 1, reflyThinkingNode);
          return index; // Skip processing the newly inserted node
        } else {
          // 无闭合标签的情况
          const content = children.slice(openTagIndex + 1);
          const reflyThinkingNode = {
            children: content,
            properties: {},
            tagName: CANVAS_THINKING_TAG,
            type: 'element',
          };

          // Replace the entire paragraph with our new reflyThinking node
          parent.children.splice(index, 1, reflyThinkingNode);
          return index; // Skip processing the newly inserted node
        }
      }
    }
  });
};

export default rehypePlugin;
