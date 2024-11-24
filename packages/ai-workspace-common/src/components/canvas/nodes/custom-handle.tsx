import { Handle, Position, Connection, HandleType } from '@xyflow/react';
import { Plus } from 'lucide-react';

interface CustomHandleProps {
  type: HandleType;
  position: Position;
  isConnected: boolean;
  isNodeHovered: boolean;
}

export const CustomHandle = ({ type, position, isConnected, isNodeHovered }: CustomHandleProps) => {
  const handleStyle = {
    width: '2px',
    height: '8px',
    background: '#00968F',
    border: 'none',
    borderRadius: '0px',
    opacity: isConnected || isNodeHovered ? 1 : 0,
    top: 'auto',
    [position === Position.Left ? 'left' : 'right']: '-1px',
    transform: 'translateY(-50%)',
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
        after:w-[1px]
        after:bg-[#D0D5DD]
        after:opacity-20
        ${position === Position.Left ? 'after:left-0' : 'after:right-0'}
      `}
    >
      <div className="absolute top-1/2 -translate-y-1/2">
        <Handle type={type} position={position} style={handleStyle} className="transition-all duration-200" />

        {position === Position.Right && isNodeHovered && (
          <div
            className={`
              absolute
              top-1/2
              -translate-y-1/2
              -right-[10px]
              w-[20px]
              h-[20px]
              rounded-full
              bg-[#00968F]
              flex
              items-center
              justify-center
              cursor-pointer
              transition-opacity
              duration-200
              hover:bg-[#007A75]
              z-10
            `}
          >
            <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
};
