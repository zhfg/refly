import { memo } from 'react';
import { MoreHorizontal, PlayCircle, FileInput, Trash2, Loader2, MessageSquareDiff, FilePlus } from 'lucide-react';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconReply } from '@refly-packages/ai-workspace-common/components/common/icon';
import TooltipWrapper from '@refly-packages/ai-workspace-common/components/common/tooltip-button';

// Action button types
type ActionButtonProps = {
  icon: React.ReactNode;
  onClick: (e: any) => void;
  loading?: boolean;
  tooltip?: string;
  withTooltip?: boolean;
};

// Action button with memoization
const ActionButton = memo((props: ActionButtonProps) => {
  const { withTooltip = true, icon, onClick, loading } = props;

  const button = (
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
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    </Button>
  );

  return withTooltip ? (
    <TooltipWrapper tooltip={props.tooltip} placement="top">
      {button}
    </TooltipWrapper>
  ) : (
    button
  );
});

type ActionButtonsProps = {
  type: 'document' | 'resource' | 'skill-response';
  onAddToContext?: () => void;
  onAddToChatHistory?: () => void;
  onRerun?: () => void;
  onInsertToDoc?: () => void;
  onDelete?: () => void;
  onHelpLink?: () => void;
  onAbout?: () => void;
  isProcessing?: boolean;
  isCompleted?: boolean;
  onCreateDocument?: () => void;
  isCreatingDocument?: boolean;
};

// Memoized action buttons container
export const ActionButtons = memo(
  ({
    type,
    onAddToContext,
    onAddToChatHistory,
    onRerun,
    onInsertToDoc,
    onDelete,
    onHelpLink,
    onAbout,
    isProcessing,
    isCompleted,
    onCreateDocument,
    isCreatingDocument,
  }: ActionButtonsProps) => {
    const { t } = useTranslation();

    // Define dropdown menu items
    const menuItems: MenuProps['items'] = [
      {
        key: 'delete',
        label: (
          <div className="flex items-center gap-2 text-red-600 whitespace-nowrap">
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            {t('canvas.nodeActions.delete')}
          </div>
        ),
        onClick: onDelete,
        className: 'hover:bg-red-50',
      },
      // {
      //   key: 'helpLink',
      //   label: (
      //     <div className="flex items-center gap-2 whitespace-nowrap">
      //       <HelpCircle className="w-4 h-4 flex-shrink-0" />
      //       Help Link
      //     </div>
      //   ),
      //   onClick: onHelpLink,
      // },
      // {
      //   key: 'about',
      //   label: (
      //     <div className="flex items-center gap-2 whitespace-nowrap">
      //       <Info className="w-4 h-4 flex-shrink-0" />
      //       About
      //     </div>
      //   ),
      //   onClick: onAbout,
      // },
    ];

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
          <ActionButton
            icon={<MessageSquareDiff className="w-4 h-4" />}
            onClick={onAddToContext}
            tooltip={t('canvas.nodeActions.addToContext')}
          />
        )}

        {/* Resource specific buttons */}
        {type === 'resource' && (
          <>
            {onAddToContext && (
              <ActionButton
                icon={<MessageSquareDiff className="w-4 h-4" />}
                onClick={onAddToContext}
                tooltip={t('canvas.nodeActions.addToContext')}
              />
            )}
            {isProcessing && (
              <ActionButton
                icon={<Loader2 className="w-4 h-4" />}
                onClick={() => {}}
                loading={true}
                tooltip={t('canvas.nodeActions.processingVector')}
              />
            )}
          </>
        )}

        {/* Skill Response specific buttons */}
        {type === 'skill-response' && (
          <>
            {onRerun &&
              (isCompleted ? null : (
                <ActionButton
                  icon={<PlayCircle className="w-4 h-4" />}
                  onClick={onRerun}
                  loading={!isCompleted}
                  tooltip={t('canvas.nodeActions.rerun')}
                />
              ))}
            {onInsertToDoc && (
              <ActionButton
                icon={<FileInput className="w-4 h-4" />}
                onClick={onInsertToDoc}
                tooltip={t('canvas.nodeActions.insertToDoc')}
              />
            )}
            {onAddToChatHistory && (
              <ActionButton
                icon={<IconReply className="w-4 h-4" />}
                onClick={onAddToChatHistory}
                tooltip={t('canvas.nodeActions.askFollowUp')}
              />
            )}
            {onCreateDocument && (
              <ActionButton
                icon={<FilePlus className="w-4 h-4" />}
                onClick={onCreateDocument}
                loading={isCreatingDocument}
                tooltip={
                  isCreatingDocument ? t('canvas.nodeStatus.isCreatingDocument') : t('canvas.nodeStatus.createDocument')
                }
              />
            )}
          </>
        )}

        {/* More options dropdown (common for all types) */}
        <Dropdown
          menu={{
            items: menuItems,
            disabled: isCreatingDocument,
          }}
          trigger={['click', 'hover']}
          placement="bottomRight"
          destroyPopupOnHide
          overlayClassName="min-w-[160px] w-max"
          getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
          dropdownRender={(menu) => (
            <div className="min-w-[160px] bg-white rounded-lg border-[0.5px] border-[rgba(0,0,0,0.03)] shadow-lg">
              {menu}
            </div>
          )}
        >
          <ActionButton
            icon={<MoreHorizontal className="w-4 h-4" />}
            onClick={(e) => e.preventDefault()}
            tooltip={t('canvas.nodeActions.moreOptions')}
            withTooltip={false}
          />
        </Dropdown>
      </div>
    );
  },
);
