import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import { NodeData } from '../types';

/**
 * Parses markdown content into a mind map tree structure
 *
 * @param markdown The markdown string to parse
 * @returns Array of NodeData objects representing the mind map structure
 */
export function parseMarkdownToMindMap(markdown: string): NodeData[] {
  const tokens = marked.lexer(markdown);
  const root: NodeData = {
    id: uuidv4(),
    label: 'Root',
    children: [],
    type: 'root',
    depth: 0,
  };
  const headingStack = [root];
  let currentParent = root;
  let maxDepth = 0;

  for (const token of tokens) {
    if (token.type === 'heading') {
      const depth = token.depth;
      const heading: NodeData = {
        id: uuidv4(),
        label: token.text,
        content: token.text,
        children: [],
        type: depth === 1 ? 'topic' : 'topic-branch',
        depth,
      };

      // Pop the stack until we find the parent heading
      while (headingStack.length > 1 && headingStack[headingStack.length - 1].depth >= depth) {
        headingStack.pop();
      }

      const parentHeading = headingStack[headingStack.length - 1];
      parentHeading.children?.push(heading);
      headingStack.push(heading);
      currentParent = heading;

      if (depth > maxDepth) maxDepth = depth;
    } else if (token.type === 'list') {
      // Process list items and add them as children to the current parent
      if (token.items?.length > 0) {
        const listItems = token.items.map((item: any) => {
          const listItemNode: NodeData = {
            id: uuidv4(),
            label: item.text,
            content: item.text,
            type: 'topic-child',
            depth: currentParent.depth ? currentParent.depth + 1 : maxDepth + 1,
            children: [],
          };

          // Handle nested lists if present
          if (item.tokens?.find((t: any) => t.type === 'list')) {
            const nestedList = item.tokens.find((t: any) => t.type === 'list');
            if (nestedList?.items) {
              listItemNode.children = nestedList.items.map((nestedItem: any) => ({
                id: uuidv4(),
                label: nestedItem.text,
                content: nestedItem.text,
                type: 'topic-child',
                depth: (listItemNode.depth || 0) + 1,
              }));
            }
          }

          return listItemNode;
        });

        if (currentParent.children) {
          currentParent.children.push(...listItems);
        } else {
          currentParent.children = listItems;
        }
      }
    } else if (token.type === 'paragraph' && currentParent !== root) {
      // If we encounter a paragraph right after a heading, it's the content for the heading
      // Add it to the richTextContent of the current parent
      if (currentParent.richTextContent === undefined) {
        currentParent.content = token.text;
        currentParent.richTextContent = {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: token.text }] }],
        };
      }
    }
  }

  return root.children || [];
}

/**
 * Removes depth property from nodes for serialization
 */
function removeDepth(nodes: NodeData[]): NodeData[] {
  return nodes.map((node: NodeData) => {
    const { depth, ...rest } = node;
    if (node.children) {
      return {
        ...rest,
        children: removeDepth(node.children),
      };
    }
    return rest;
  });
}

/**
 * Gets nodes with depth property removed
 */
export function getNodes(markdown: string): NodeData[] {
  return removeDepth(parseMarkdownToMindMap(markdown));
}

/**
 * Gets marked lexer tokens from markdown
 */
export function getSingleNode(markdown: string) {
  return marked.lexer(markdown);
}

/**
 * Serializes a mind map data structure back to markdown
 *
 * @param mindMap The mind map data to serialize
 * @returns A markdown string representation of the mind map
 */
export function serializeMindMapToMarkdown(mindMap: NodeData | NodeData[]): string {
  const nodes = Array.isArray(mindMap) ? mindMap : [mindMap];
  let markdown = '';

  // Helper function to process a node and its children
  const processNode = (node: NodeData, level: number): void => {
    // Generate heading based on depth
    if (node.type !== 'root') {
      const headingMarkers = '#'.repeat(level);
      markdown += `${headingMarkers} ${node.label}\n\n`;

      // Add content if exists and different from label
      if (node.content && node.content !== node.label) {
        markdown += `${node.content}\n\n`;
      } else if (node.richTextContent) {
        // If there's rich text content but no plain content, try to extract text
        try {
          const richContent =
            typeof node.richTextContent === 'string'
              ? JSON.parse(node.richTextContent)
              : node.richTextContent;

          if (richContent.content && Array.isArray(richContent.content)) {
            const extractedText = extractTextFromRichContent(richContent);
            if (extractedText && extractedText !== node.label) {
              markdown += `${extractedText}\n\n`;
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }

    // Process children
    if (node.children?.length > 0) {
      // If the children are leaf nodes (topic-child), render them as a list
      const isLeafChildren = node.children.every(
        (child) => child.type === 'topic-child' || !child.children || child.children.length === 0,
      );

      if (isLeafChildren) {
        for (const child of node.children) {
          markdown += `- ${child.label}\n`;

          // If this child has its own children, nest them
          if (child.children?.length > 0) {
            markdown += processNestedList(child.children, 1);
          }
        }
        markdown += '\n';
      } else {
        // Process as regular headings
        for (const child of node.children) {
          processNode(child, level + 1);
        }
      }
    }
  };

  // Helper function to process nested lists
  const processNestedList = (items: NodeData[], indent: number): string => {
    let result = '';
    for (const item of items) {
      const indentation = '  '.repeat(indent);
      result += `${indentation}- ${item.label}\n`;

      if (item.children?.length > 0) {
        result += processNestedList(item.children, indent + 1);
      }
    }
    return result;
  };

  // Process each top-level node
  for (const node of nodes) {
    processNode(node, 1);
  }

  return markdown;
}

/**
 * Extract text from rich text content
 */
function extractTextFromRichContent(richContent: any): string {
  let text = '';

  if (richContent.content && Array.isArray(richContent.content)) {
    for (const block of richContent.content) {
      if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
        for (const inline of block.content) {
          if (inline.type === 'text') {
            text += `${inline.text} `;
          }
        }
        text += '\n';
      }
    }
  }

  return text.trim();
}
