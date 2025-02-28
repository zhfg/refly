import { SKIP, visit } from 'unist-util-visit';

import { ARTIFACT_TAG } from '@refly-packages/ai-workspace-common/modules/artifacts/const';

function rehypePlugin() {
  return (tree: any) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'element' && node.tagName === 'p' && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.type === 'raw' && firstChild.value.startsWith(`<${ARTIFACT_TAG}`)) {
          // 提取 reflyCanvas 的属性
          const attributes: Record<string, string> = {};
          const attributeRegex = /(\w+)="([^"]*)"/g;
          let match: RegExpExecArray | null;
          match = attributeRegex.exec(firstChild.value);
          while (match !== null) {
            attributes[match[1]] = match[2];
            match = attributeRegex.exec(firstChild.value);
          }

          // 创建新的 reflyCanvas 节点
          const newNode = {
            children: [
              {
                type: 'text',
                value: [node.children?.[1]]
                  ?.map((child: any) => {
                    if (child.type === 'raw') {
                      return child.value;
                    }
                    if (child.type === 'text') {
                      return child.value;
                    }
                    if (child.type === 'element' && child.tagName === 'a') {
                      return child.children[0].value;
                    }
                    return '';
                  })
                  ?.join('')
                  ?.trim(),
              },
            ],
            properties: attributes,
            tagName: ARTIFACT_TAG,
            type: 'element',
          };

          // 替换原来的 p 节点
          parent.children.splice(index, 1, newNode);
          return [SKIP, index];
        }
      }
      // 如果字符串是 <reflyCanvas identifier="ai-new-interpretation" type="image/svg+xml" title="人工智能新解释">
      // 得到的节点就是：
      // {
      //   type: 'raw',
      //   value:
      //     '<reflyCanvas identifier="ai-new-interpretation" type="image/svg+xml" title="人工智能新解释">',
      // }
      else if (node.type === 'raw' && node.value.startsWith(`<${ARTIFACT_TAG}`)) {
        // 创建新的 reflyCanvas 节点
        const newNode = {
          children: [],
          properties: {},
          tagName: ARTIFACT_TAG,
          type: 'element',
        };

        // 替换原来的 p 节点
        parent.children.splice(index, 1, newNode);
        return [SKIP, index];
      }
    });
  };
}

export default rehypePlugin;
