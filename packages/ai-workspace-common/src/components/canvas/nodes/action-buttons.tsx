import { MoreHorizontal, PlayCircle, FileText, Link, HelpCircle, Info, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'antd';

// Action button types
type ActionButtonProps = {
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  tooltip?: string;
};

// Common action button component
const ActionButton = ({ icon, onClick, loading, tooltip }: ActionButtonProps) => (
  <Button
    className="
      p-2
      rounded-lg
      bg-white
      hover:bg-gray-50
      text-[rgba(0,0,0,0.5)]
      transition-colors
      duration-200
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
    type="text"
    onClick={onClick}
    disabled={loading}
    title={tooltip}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
  </Button>
);

// Dropdown menu component
const DropdownMenu = ({
  onDelete,
  onHelpLink,
  onAbout,
}: {
  onDelete: () => void;
  onHelpLink: () => void;
  onAbout: () => void;
}) => (
  <div
    className="
    absolute
    right-0
    mt-1
    p-1
    bg-white
    rounded-lg
    border-[0.5px]
    border-[rgba(0,0,0,0.03)]
    shadow-lg
    z-50
    min-w-[160px]
  "
  >
    <button
      onClick={onDelete}
      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
    <button
      onClick={onHelpLink}
      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2"
    >
      <HelpCircle className="w-4 h-4" />
      Help Link
    </button>
    <button
      onClick={onAbout}
      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2"
    >
      <Info className="w-4 h-4" />
      About
    </button>
  </div>
);

type ActionButtonsProps = {
  type: 'document' | 'resource' | 'skill-response';
  onAddToContext?: () => void;
  onRerun?: () => void;
  onInsertToDoc?: () => void;
  onDelete?: () => void;
  onHelpLink?: () => void;
  onAbout?: () => void;
  isProcessing?: boolean;
  isCompleted?: boolean;
};

export const ActionButtons = ({
  type,
  onAddToContext,
  onRerun,
  onInsertToDoc,
  onDelete,
  onHelpLink,
  onAbout,
  isProcessing,
  isCompleted,
}: ActionButtonsProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className="
        absolute 
        -top-12
        right-0
        opacity-0 
        group-hover:opacity-100
        transition-opacity 
        duration-200
        ease-in-out
        z-50
        flex
        gap-1
        p-1
        rounded-lg
        bg-white
        border-[0.5px]
        border-[rgba(0,0,0,0.03)]
        shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]
      "
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* Document specific buttons */}
      {type === 'document' && onAddToContext && (
        <ActionButton icon={<FileText className="w-4 h-4" />} onClick={onAddToContext} tooltip="Add to Context" />
      )}

      {/* Resource specific buttons */}
      {type === 'resource' && (
        <>
          {onAddToContext && (
            <ActionButton icon={<Link className="w-4 h-4" />} onClick={onAddToContext} tooltip="Add to Context" />
          )}
          {isProcessing && (
            <ActionButton
              icon={<Loader2 className="w-4 h-4" />}
              onClick={() => {}}
              loading={true}
              tooltip="Processing Vector"
            />
          )}
        </>
      )}

      {/* Skill Response specific buttons */}
      {type === 'skill-response' && (
        <>
          {onRerun && (
            <ActionButton
              icon={<PlayCircle className="w-4 h-4" />}
              onClick={onRerun}
              loading={!isCompleted}
              tooltip="Rerun"
            />
          )}
          {onInsertToDoc && (
            <ActionButton
              icon={<FileText className="w-4 h-4" />}
              onClick={onInsertToDoc}
              tooltip="Insert to Document"
            />
          )}
          {onAddToContext && (
            <ActionButton icon={<Link className="w-4 h-4" />} onClick={onAddToContext} tooltip="Add to Context" />
          )}
        </>
      )}

      {/* More options button (common for all types) */}
      <div className="relative">
        <ActionButton
          icon={<MoreHorizontal className="w-4 h-4" />}
          onClick={() => setShowDropdown(!showDropdown)}
          tooltip="More Options"
        />
        {showDropdown && (
          <DropdownMenu
            onDelete={onDelete ?? (() => {})}
            onHelpLink={onHelpLink ?? (() => {})}
            onAbout={onAbout ?? (() => {})}
          />
        )}
      </div>
    </div>
  );
};
