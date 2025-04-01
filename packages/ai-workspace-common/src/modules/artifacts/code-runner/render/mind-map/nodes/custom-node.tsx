import { useRef, memo, useState, useCallback, useEffect } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { Button } from 'antd';
import { useEditor, EditorContent } from '@tiptap/react';
import { Markdown } from 'tiptap-markdown';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useThrottledCallback } from 'use-debounce';
import { EditorInstance } from '@refly-packages/ai-workspace-common/components/editor/core/components';
import classNames from 'classnames';
import { MemoEditor } from '@refly-packages/ai-workspace-common/components/canvas/nodes/memo/memo-editor';
import { useMindMapHoverEffect } from '../hooks/use-mind-map-hover';
import './custom-node.scss';

interface NodeColors {
  bg: string;
  border: string;
}

// Custom node component with hover menu and edit functionality
export const CustomNode = memo(({ id, data }: NodeProps) => {
  // Safe type assertion with runtime checks
  const nodeData = data as any;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bgColor, setBgColor] = useState<string>('');
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isOperating = nodeData?.isOperating || false;

  // Use the hover effect hook for ReactFlow state updates
  const { handleMouseEnter, handleMouseLeave } = useMindMapHoverEffect(id);

  // Parent component hover handler
  const onHover = nodeData?.onHover;

  // Make sure we have valid node data
  if (!nodeData || typeof nodeData !== 'object') {
    return <div className="p-2 text-red-500">Missing node data</div>;
  }

  // Ensure required properties exist
  const label = typeof nodeData.label === 'string' ? nodeData.label : 'Untitled';
  const hasChildren = nodeData?.hasChildren;
  const colors: NodeColors = nodeData?.colors || {
    bg: 'rgb(255, 255, 255)',
    border: 'rgb(203, 213, 225)',
  };
  const level = nodeData?.level || 0;

  // Update bgColor from props, but only when needed to avoid render loops
  useEffect(() => {
    if (bgColor !== colors.bg) {
      setBgColor(colors.bg);
    }
  }, [colors.bg]);

  // Define content update callback before editor initialization
  const onContentUpdate = useCallback(
    (editor: EditorInstance) => {
      const markdown = editor.storage.markdown.getMarkdown();
      const jsonContent = editor.getJSON();

      if (typeof nodeData.onContentChange === 'function') {
        nodeData.onContentChange(id, markdown, jsonContent);
      }
    },
    [id, nodeData],
  );

  // Throttle the content update callback
  const handleContentUpdate = useThrottledCallback(onContentUpdate, 200);

  // Setup rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'highlight',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        validate: (href) => /^(https?:\/\/|mailto:|tel:)/.test(href),
      }),
      Markdown.configure({
        html: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Enter your content here...',
      }),
    ],
    // Use richTextContent if available, otherwise fallback to content or label
    content: nodeData?.richTextContent || nodeData?.content || label,
    editable: isEditing || isOperating, // Start with non-editable, will update in useEffect
    onUpdate: ({ editor }) => {
      handleContentUpdate(editor);
    },
    onBlur: () => {
      if (!isOperating) {
        setIsEditing(false);
      }
      recalculateNodeHeight();
    },
    editorProps: {
      attributes: {
        class: classNames('max-w-none', 'focus:outline-none', 'min-h-[30px]', 'w-full', 'h-full'),
      },
    },
  });

  const recalculateNodeHeight = useCallback(() => {
    if (contentRef.current && nodeRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const newHeight = Math.max(60, contentHeight + 20); // Add padding

      if (typeof nodeData.onResizeNode === 'function') {
        nodeData.onResizeNode(id, 400, newHeight);
      }
    }
  }, [id, nodeData]);

  // Run height recalculation after component mounts and editor is ready
  useEffect(() => {
    if (editor && contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        recalculateNodeHeight();
      }, 50); // Small delay to ensure content is rendered

      return () => clearTimeout(timeoutId);
    }
  }, [editor, recalculateNodeHeight]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    if (editor) {
      editor.setEditable(true);
      setTimeout(() => {
        editor.commands.focus();
      }, 0);
    }
  }, [editor]);

  const handleBgColorChange = useCallback(
    (color: string) => {
      setBgColor(color);
      if (typeof nodeData.onColorChange === 'function') {
        nodeData.onColorChange(id, { bg: color, border: colors.border });
      }
    },
    [id, colors.border, nodeData],
  );

  // Combined hover handler
  const onMouseEnter = useCallback(() => {
    setIsHovered(true);
    handleMouseEnter();
    if (typeof onHover === 'function') {
      onHover(id);
    }
  }, [handleMouseEnter, onHover, id]);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    handleMouseLeave();
    if (typeof onHover === 'function') {
      onHover(null);
    }
  }, [handleMouseLeave, onHover]);

  // Determine if this is the root node
  const isRoot = id === 'root' || nodeData.isRoot;

  // Determine the color for the toggle button
  const buttonColor = nodeData.isExpanded
    ? colors.border
    : nodeData.childCount > 0
      ? '#f97316'
      : colors.border; // Orange color for nodes with children when collapsed

  return (
    <>
      <div
        ref={nodeRef}
        className={classNames(
          'rounded-lg border shadow-sm transition-all',
          { 'shadow-xs border-gray-200': isHovered },
          { 'nodrag nopan': isEditing || isOperating },
          { nowheel: (isEditing || isOperating) && isHovered },
          { 'select-text': isEditing || isOperating },
        )}
        style={{
          borderColor: colors.border,
          backgroundColor: bgColor,
          width: '400px',
          height: 'auto',
          minHeight: '40px',
          zIndex: isHovered || isOperating ? 1000 : 0, // Set higher z-index when hovered or operating
          boxShadow: isOperating ? '0 0 0 2px #00968F' : undefined, // Highlight when operating
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex flex-col h-full w-full p-3">
          <div
            ref={contentRef}
            className="w-full overflow-auto"
            style={{
              color: isRoot
                ? 'rgb(30 64 175)'
                : `rgb(${55 + level * 10}, ${65 + level * 10}, ${75 + level * 10})`,
              cursor: isEditing || isOperating ? 'text' : 'pointer',
            }}
          >
            {editor && (
              <EditorContent
                editor={editor}
                className={classNames('text-xs rich-text-editor memo-node-editor', 'w-full', {
                  'select-text': isEditing || isOperating,
                })}
              />
            )}
          </div>
        </div>

        {/* Editor menu bar - show when editing, operating, or hovering */}
        {isEditing && isOperating && editor && (
          <MemoEditor editor={editor} bgColor={bgColor} onChangeBackground={handleBgColorChange} />
        )}

        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 space-x-1 rounded-md bg-white p-1 shadow-md z-10">
            <Button
              size="small"
              className="h-7 text-xs hover:!border-[#00968F] hover:!text-[#00968F]"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof nodeData.onAddChild === 'function') {
                  nodeData.onAddChild(id);
                }
              }}
            >
              + Child
            </Button>
            {!isRoot && (
              <Button
                size="small"
                className="h-7 text-xs hover:!border-[#00968F] hover:!text-[#00968F]"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof nodeData.onAddSibling === 'function') {
                    nodeData.onAddSibling(id);
                  }
                }}
              >
                + Sibling
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse button positioned outside the node */}
      {hasChildren && (
        <div
          className="absolute z-20"
          style={{
            top: '50%',
            right: '-28px',
            transform: 'translateY(-50%)',
          }}
        >
          <Button
            type="text"
            size="small"
            className="flex items-center justify-center rounded-full shadow-sm"
            style={{
              width: '20px',
              height: '20px',
              minWidth: '20px',
              padding: '0',
              backgroundColor: 'white',
              color: buttonColor,
              border: `1px solid ${buttonColor}30`,
              fontSize: '12px',
              lineHeight: '18px',
              fontWeight: 'bold',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof nodeData.onToggleExpand === 'function') {
                nodeData.onToggleExpand(id);
              }
            }}
            title={nodeData.isExpanded ? 'Collapse' : `Expand (${nodeData.childCount || 0} items)`}
          >
            {nodeData.isExpanded ? (
              <span>−</span>
            ) : (
              <span>+{nodeData.childCount > 0 ? nodeData.childCount : ''}</span>
            )}
          </Button>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        style={{ backgroundColor: colors.border }}
        className="w-2 h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        style={{ backgroundColor: colors.border }}
        className="w-2 h-2"
      />
    </>
  );
});
