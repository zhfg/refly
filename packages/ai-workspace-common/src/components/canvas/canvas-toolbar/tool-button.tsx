import { memo, FC } from 'react';
import { Button, Badge } from 'antd';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import TooltipWrapper from '@refly-packages/ai-workspace-common/components/common/tooltip-button';

// Define toolbar item interface
export interface ToolbarItem {
  type: 'button' | 'popover' | 'divider';
  icon?: React.ElementType;
  value?: string;
  domain?: string;
  tooltip?: string;
  active?: boolean;
}

interface ToolButtonProps {
  tool: ToolbarItem;
  selectedNodes: NodeItem[];
  handleToolSelect: (event: React.MouseEvent, tool: string) => void;
  getIconColor: (tool: string) => string;
  getIsLoading: (tool: string) => boolean;
}

export const ToolButton: FC<ToolButtonProps> = memo(
  ({
    tool,
    selectedNodes,
    handleToolSelect,
    getIconColor,
    getIsLoading,
  }: {
    tool: ToolbarItem;
    selectedNodes: NodeItem[];
    handleToolSelect: (event: React.MouseEvent, tool: string) => void;
    getIconColor: (tool: string) => string;
    getIsLoading: (tool: string) => boolean;
  }) => {
    return (
      <TooltipWrapper tooltip={tool.tooltip}>
        {selectedNodes.length > 0 && tool.value === 'handleLaunchpad' ? (
          <Badge size="small" color="#00968F" offset={[-2, 2]} count={selectedNodes.length} overflowCount={9999}>
            <Button
              type="text"
              onClick={(event) => handleToolSelect(event, tool.value)}
              className={`
                      h-[32px] w-[32px] 
                      flex items-center justify-center 
                      hover:bg-gray-100 rounded-lg 
                      transition-colors duration-200 
                      group
                      ${tool.active ? 'bg-gray-100' : ''}
                    `}
              icon={
                <tool.icon
                  className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900"
                  style={{ color: getIconColor(tool.value) }}
                />
              }
              loading={getIsLoading(tool.value)}
            />
          </Badge>
        ) : (
          <Button
            type="text"
            onClick={(event) => handleToolSelect(event, tool.value)}
            className={`
                      h-[32px] w-[32px] 
                      flex items-center justify-center 
                      hover:bg-gray-100 rounded-lg 
                      transition-colors duration-200 
                      group
                      ${tool.active ? 'bg-gray-100' : ''}
                    `}
            icon={
              <tool.icon
                className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900"
                style={{ color: getIconColor(tool.value) }}
              />
            }
            loading={getIsLoading(tool.value)}
          />
        )}
      </TooltipWrapper>
    );
  },
);
