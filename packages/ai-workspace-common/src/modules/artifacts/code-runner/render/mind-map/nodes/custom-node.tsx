import React, { useRef, memo } from 'react';
import { useState } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { Button } from 'antd';

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
  const [labelText, setLabelText] = useState(nodeData?.label || 'New Node');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (typeof nodeData.onLabelChange === 'function' && labelText !== label) {
      nodeData.onLabelChange(id, labelText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (typeof nodeData.onLabelChange === 'function' && labelText !== label) {
        nodeData.onLabelChange(id, labelText);
      }
    } else if (e.key === 'Escape') {
      setLabelText(label);
      setIsEditing(false);
    }
  };

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
        className={`min-w-[200px] rounded-lg border p-3 shadow-sm transition-all hover:shadow-md ${
          isHovered ? 'shadow-md' : ''
        }`}
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
          minHeight: '40px',
          maxWidth: '220px',
          transform: `scale(${isHovered ? 1.02 : 1})`,
          transition: 'all 0.2s ease',
          zIndex: isHovered ? 10 : 'auto',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              ref={inputRef}
              className="w-full border-none bg-gray-50 p-1 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div
              className="overflow-hidden text-ellipsis whitespace-nowrap font-medium"
              style={{
                color: isRoot
                  ? 'rgb(30 64 175)'
                  : `rgb(${55 + level * 10}, ${65 + level * 10}, ${75 + level * 10})`,
              }}
            >
              {label}
            </div>
          )}
        </div>

        {isHovered && !isEditing && (
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
