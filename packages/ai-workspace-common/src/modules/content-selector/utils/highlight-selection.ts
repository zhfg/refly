import { INLINE_SELECTED_MARK_ID } from '@refly-packages/ai-workspace-common/modules/content-selector/utils';
import { getMarkdown } from '@refly-packages/utils/html2md';

export function highlightSelection(xPath: string) {
  const selection = window.getSelection();
  const selectedNodes = [];

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectedTextNodes = getTextNodesInRange(range);

    selectedTextNodes.forEach(({ node, text, startOffset, endOffset }) => {
      const span = document.createElement('span');
      span.setAttribute(INLINE_SELECTED_MARK_ID, xPath);
      span.textContent = text; // 将选中的文本内容放入 span 中

      const newNode = node.splitText(startOffset);
      newNode.splitText(endOffset - startOffset);
      newNode.parentNode.replaceChild(span, newNode); // 替换选中的文本节点

      range.setStartAfter(span); // 更新范围
      selectedNodes.push(span);
    });

    // 清除选区
    selection.removeAllRanges();
  }

  return selectedNodes;
}

function getTextNodesInRange(range) {
  const textNodes = [];
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // 获取范围内的所有文本节点
  function traverseNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (range.intersectsNode(node)) {
        let startOffset = 0;
        let endOffset = node.nodeValue.length;

        if (node === startContainer) {
          startOffset = range.startOffset;
        }
        if (node === endContainer) {
          endOffset = range.endOffset;
        }

        const text = node.nodeValue.substring(startOffset, endOffset);
        if (text.trim()) {
          textNodes.push({ node, text, startOffset, endOffset });
        }
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverseNodes(node.childNodes[i]);
      }
    }
  }

  // 使用 range.commonAncestorContainer 来遍历所有相关节点
  traverseNodes(range.commonAncestorContainer);

  return Array.from(new Set(textNodes));
}

export function removeHighlight(xPath: string) {
  const highlightedSpans = document.querySelectorAll(`span[${INLINE_SELECTED_MARK_ID}="${xPath}"]`);

  highlightedSpans.forEach((span) => {
    const parent = span.parentNode;
    const textContent = span.textContent;

    // 创建一个新的文本节点来替换 span
    const textNode = document.createTextNode(textContent);
    parent.replaceChild(textNode, span);

    // 尝试合并相邻的文本节点
    parent.normalize();
  });
}

export function getSelectionNodesMarkdown() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const fragment = range.cloneRange().cloneContents();
  const mdText = getMarkdown(fragment);

  return mdText;
}
