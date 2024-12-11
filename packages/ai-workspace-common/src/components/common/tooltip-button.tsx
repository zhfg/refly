import { memo } from 'react';
import { Tooltip, TooltipProps } from 'antd';

interface TooltipWrapperProps {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
}

// 使用 memo 包裹组件以避免不必要的重渲染
const TooltipWrapper = memo(
  ({
    tooltip,
    children,
    mouseEnterDelay = 0.5,
    mouseLeaveDelay = 0.1,
    placement = 'right',
    overlayClassName = '!px-2 !py-1',
    arrow = false,
    destroyTooltipOnHide = true,
    ...tooltipProps
  }: TooltipWrapperProps & TooltipProps) => {
    // 如果没有 tooltip，直接返回子元素
    if (!tooltip) {
      return children;
    }

    return (
      <Tooltip
        title={tooltip}
        mouseEnterDelay={mouseEnterDelay}
        mouseLeaveDelay={mouseLeaveDelay}
        placement={placement}
        overlayClassName={overlayClassName}
        arrow={arrow}
        destroyTooltipOnHide={destroyTooltipOnHide}
        {...tooltipProps}
      >
        {children}
      </Tooltip>
    );
  },
);

TooltipWrapper.displayName = 'TooltipWrapper';

export default TooltipWrapper;
