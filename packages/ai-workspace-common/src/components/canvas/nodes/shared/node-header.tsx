import { memo, useState, useRef, useEffect } from 'react';
import { IconType } from 'react-icons';
import { Input, Typography } from 'antd';
import type { InputRef } from 'antd';

interface NodeHeaderProps {
  title: string;
  Icon: IconType;
  iconBgColor?: string;
  canEdit?: boolean;
  updateTitle?: (title: string) => void;
}

export const NodeHeader = memo(
  ({ title, Icon, iconBgColor = '#17B26A', canEdit = false, updateTitle }: NodeHeaderProps) => {
    const [editTitle, setEditTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    return (
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)] flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBgColor }}
          >
            <Icon className="w-4 h-4 text-white" />
            <div>{isEditing}</div>
          </div>
          {canEdit && isEditing ? (
            <Input
              ref={inputRef}
              className="!border-transparent font-bold focus:!bg-transparent px-0.5 py-0"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                updateTitle?.(e.target.value);
              }}
              onBlur={() => {
                setIsEditing(false);
              }}
            />
          ) : (
            <Typography.Text
              className="text-sm font-bold leading-normal truncate"
              title={title}
              onClick={() => {
                if (canEdit) {
                  setIsEditing(true);
                }
              }}
            >
              {title}
            </Typography.Text>
          )}
        </div>
      </div>
    );
  },
);
