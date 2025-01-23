import { Handle, Position, HandleType } from '@xyflow/react';

interface CustomHandleProps {
  type: HandleType;
  position: Position;
  isConnected: boolean;
  isNodeHovered: boolean;
  nodeType: string;
}

const canAcceptConnection = (nodeType: string, isConnected: boolean) => {
  return ['tool', 'skill'].includes(nodeType) && !isConnected;
};

const canShowPlusHandle = (nodeType: string) => {
  return ['document', 'resource', 'response'].includes(nodeType);
};

export const CustomHandle = ({
  type,
  position,
  isConnected,
  isNodeHovered,
  nodeType,
}: CustomHandleProps) => {
  const baseHandleStyle = {
    width: '2px',
    height: '8px',
    background: isNodeHovered ? '#00968F' : 'transparent',
    border: 'none',
    minHeight: '8px',
    minWidth: '2px',
    borderRadius: '0px',
    opacity: isConnected && !isNodeHovered ? 1 : 0,
    top: 'auto',
    [position === Position.Left ? 'left' : 'right']: '-2px',
    transform: 'translateY(-50%)',
    zIndex: 1,
  };

  // Plus 按钮作为 handle 的样式
  const plusHandleStyle = {
    ...baseHandleStyle,
    opacity: isNodeHovered ? 1 : 0,
    width: '20px',
    height: '20px',
    minWidth: '20px',
    minHeight: '20px',
    background: '#00968F',
    borderRadius: '50%',
    [position === Position.Left ? 'left' : 'right']: '-10px',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 2px 0px rgba(16,24,40,0.06), 0px 1px 3px 0px rgba(16,24,40,0.1)',
    transition: 'all 0.2s ease-in-out',
  };

  return (
    <div
      className={`
        absolute top-0 ${position === Position.Left ? 'left-0' : 'right-0'} h-full
        flex items-center
        after:content-['']
        after:absolute
        after:top-[24px]
        after:bottom-[24px]
        after:bg-[#D0D5DD]
        after:opacity-20
        ${position === Position.Left ? 'after:left-0' : 'after:right-0'}
      `}
    >
      <div className="absolute top-1/2 -translate-y-1/2">
        {/* Left handle - only show if position is left and can accept connections */}
        {position === Position.Left && (
          <Handle type={type} position={position} style={baseHandleStyle} isConnectable={false} />
        )}

        {/* Right handle - only show if position is right */}
        {position === Position.Right && (
          <>
            <Handle
              type={type}
              position={position}
              style={baseHandleStyle}
              isConnectable={canAcceptConnection(nodeType, isConnected)}
            />

            {/* Plus button handle - only show for document/resource/response nodes */}
            {/* {canShowPlusHandle(nodeType) && (
              <Handle
                type={type}
                position={position}
                style={plusHandleStyle}
                isConnectable={true}
                className="
                  group
                  hover:![background-color:#007A75]
                  translate-y-[-50%]
                  hover:![transform:translate(0,-50%)_scale(1.5)]
                  transition-all
                  duration-200
                  [transform-origin:center_center]!important
                "
              >
                <Plus
                  className="
                    w-3 
                    h-3 
                    text-white 
                    pointer-events-none
                    transition-transform
                    duration-200
                  "
                  strokeWidth={2.5}
                />
              </Handle>
            )} */}
          </>
        )}
      </div>
    </div>
  );
};
