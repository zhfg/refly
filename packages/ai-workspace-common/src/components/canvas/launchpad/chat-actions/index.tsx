import { Button, Tooltip } from 'antd';
import { FormInstance } from '@arco-design/web-react';
import { useRef, useMemo, useCallback } from 'react';
import { memo } from 'react';

import { IconSend } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';

import { getRuntime } from '@refly/utils/env';
import { ModelSelector } from './model-selector';
import { ModelInfo } from '@refly/openapi-schema';
import { cn } from '@refly-packages/utils/index';

export interface CustomAction {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

interface ChatActionsProps {
  query: string;
  model: ModelInfo;
  setModel: (model: ModelInfo) => void;
  className?: string;
  form?: FormInstance;
  handleSendMessage: () => void;
  handleAbort: () => void;
  customActions?: CustomAction[];
}

export const ChatActions = memo(
  (props: ChatActionsProps) => {
    const { query, model, setModel, handleSendMessage, customActions, className } = props;
    const { t } = useTranslation();

    const handleSendClick = useCallback(() => {
      handleSendMessage();
    }, [handleSendMessage]);

    // hooks
    const runtime = getRuntime();
    const isWeb = runtime === 'web';

    const userStore = useUserStoreShallow((state) => ({
      isLogin: state.isLogin,
    }));

    const canSendEmptyMessage = useMemo(() => query?.trim(), [query]);
    const canSendMessage = useMemo(
      () => !userStore.isLogin || canSendEmptyMessage,
      [userStore.isLogin, canSendEmptyMessage],
    );

    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div className={cn('flex justify-between items-center', className)} ref={containerRef}>
        <div className="flex gap-2.5">
          <ModelSelector model={model} setModel={setModel} briefMode={false} trigger={['click']} />
        </div>
        <div className="flex flex-row items-center gap-2">
          {customActions?.map((action, index) => (
            <Tooltip title={action.title} key={index}>
              <Button size="small" onClick={action.onClick} className="mr-0">
                {action.icon}
              </Button>
            </Tooltip>
          ))}

          {!isWeb ? null : (
            <Button
              size="small"
              type="primary"
              disabled={!canSendMessage}
              className="text-xs flex items-center gap-1"
              onClick={handleSendClick}
            >
              <IconSend />
              <span>{t('copilot.chatActions.send')}</span>
            </Button>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo
    return (
      prevProps.handleSendMessage === nextProps.handleSendMessage &&
      prevProps.handleAbort === nextProps.handleAbort
    );
  },
);

ChatActions.displayName = 'ChatActions';
