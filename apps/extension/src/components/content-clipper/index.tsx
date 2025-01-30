import React, { useCallback, useState, useEffect } from 'react';
import { Button, Input, message } from 'antd';
import { IconCopy, IconDelete, IconSave } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useSaveSelectedContent } from '@/hooks/use-save-selected-content';
import { useSaveResourceNotify } from '@refly-packages/ai-workspace-common/hooks/use-save-resouce-notify';
import {
  onMessage,
  sendMessage,
} from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { BackgroundMessage } from '@refly/common-types';
import { getRuntime } from '@refly/utils/env';

const { TextArea } = Input;

interface ContentClipperProps {
  className?: string;
  onSaveSuccess?: () => void;
}

interface PageContent {
  title: string;
  url: string;
  content: string;
}

export const ContentClipper: React.FC<ContentClipperProps> = ({ className, onSaveSuccess }) => {
  const { t } = useTranslation();
  const [pageInfo, setPageInfo] = useState<PageContent>({
    title: '',
    url: '',
    content: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { saveSelectedContent } = useSaveSelectedContent();
  const { handleSaveResourceAndNotify } = useSaveResourceNotify();

  // Listen for content from content script
  useEffect(() => {
    onMessage((event: MessageEvent<any>) => {
      const data = event as any as BackgroundMessage;
      if (data?.name === 'getPageContentResponse') {
        const response = data;
        if (response?.body) {
          setPageInfo(response.body);
        }
      }
    }, getRuntime());
  }, []);

  // Handle clip current page content
  const handleClipContent = useCallback(async () => {
    try {
      // Send message to content script to get page content
      const msg: BackgroundMessage = {
        source: getRuntime(),
        name: 'getPageContent',
      };
      sendMessage(msg);
    } catch (err) {
      console.error('Failed to clip content:', err);
      message.error(t('extension.webClipper.error.clipContentFailed'));
    }
  }, [t]);

  // Handle save content
  const handleSave = useCallback(async () => {
    if (!pageInfo.content?.trim()) {
      message.warning(t('extension.webClipper.error.contentRequired'));
      return;
    }

    setIsSaving(true);
    try {
      // Use handleSaveResourceAndNotify to handle saving with notification
      await handleSaveResourceAndNotify(async () => {
        const result = await saveSelectedContent(pageInfo.content, {
          title: pageInfo.title,
          url: pageInfo.url,
        });
        if (result?.success) {
          setPageInfo({ title: '', url: '', content: '' });
          onSaveSuccess?.();
        }
        return result;
      });
    } catch (err) {
      console.error('Failed to save content:', err);
      message.error(t('extension.webClipper.error.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [pageInfo, saveSelectedContent, handleSaveResourceAndNotify, t, onSaveSuccess]);

  // Handle clear content
  const handleClear = useCallback(() => {
    setPageInfo({ title: '', url: '', content: '' });
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Save on Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  // Handle content change
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPageInfo((prev) => ({ ...prev, content: e.target.value }));
  }, []);

  return (
    <div className={`flex flex-col gap-4 p-0 ${className}`}>
      <div className="flex flex-col gap-2">
        <TextArea
          placeholder={t('extension.webClipper.placeholder.enterOrClipContent')}
          value={pageInfo.content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 4, maxRows: 8 }}
          className="w-full resize-none"
        />
        <div className="flex flex-row justify-end gap-2">
          {pageInfo.content && (
            <Button size="small" icon={<IconDelete />} onClick={handleClear}>
              {t('extension.webClipper.action.clear')}
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<IconSave />}
            loading={isSaving}
            disabled={!pageInfo.content?.trim()}
            onClick={handleSave}
          >
            {t('extension.webClipper.action.save')}
          </Button>
        </div>
      </div>
      <Button
        type="primary"
        size="large"
        icon={<IconCopy />}
        onClick={handleClipContent}
        className="self-end w-full"
      >
        {t('extension.webClipper.action.clip')}
      </Button>
    </div>
  );
};
