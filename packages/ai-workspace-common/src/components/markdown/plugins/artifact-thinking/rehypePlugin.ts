import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

import { ARTIFACT_THINKING_TAG } from '@refly-packages/ai-workspace-common/modules/artifacts/const';

// eslint-disable-next-line unicorn/consistent-function-scoping
const rehypePlugin = () => (tree: Node) => {
  visit(tree, 'element', (node: any, index, parent) => {
    if (node.type === 'element' && node.tagName === 'p') {
      const children = node.children || [];
      const openTagIndex = children.findIndex(
        (child: any) => child.type === 'raw' && child.value === `<${ARTIFACT_THINKING_TAG}>`,
      );
      const closeTagIndex = children.findIndex(
        (child: any) => child.type === 'raw' && child.value === `</${ARTIFACT_THINKING_TAG}>`,
      );

      if (openTagIndex !== -1) {
        // Case with closing tag
        if (closeTagIndex !== -1 && closeTagIndex > openTagIndex) {
          const content = children.slice(openTagIndex + 1, closeTagIndex);
          const reflyThinkingNode = {
            children: content,
            properties: {},
            tagName: ARTIFACT_THINKING_TAG,
            type: 'element',
          };

          // Replace the entire paragraph with our new reflyThinking node
          parent.children.splice(index, 1, reflyThinkingNode);
          return index; // Skip processing the newly inserted node
        }

        // No closing tag case
        const content = children.slice(openTagIndex + 1);
        const reflyThinkingNode = {
          children: content,
          properties: {},
          tagName: ARTIFACT_THINKING_TAG,
          type: 'element',
        };

        // Replace the entire paragraph with our new reflyThinking node
        parent.children.splice(index, 1, reflyThinkingNode);
        return index; // Skip processing the newly inserted node
      }
    }
  });
};

export default rehypePlugin;
