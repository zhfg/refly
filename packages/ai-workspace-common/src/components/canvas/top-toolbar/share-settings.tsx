import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Popover, Select, Button, Divider, message } from 'antd';
import {
  IconShare,
  IconClose,
  IconLink,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { MdOutlinePublish } from 'react-icons/md';
import { RiUserForbidLine } from 'react-icons/ri';
import { GrLanguage } from 'react-icons/gr';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getClientOrigin } from '@refly/utils/url';

type ShareAccess = 'off' | 'anyone';

interface ShareSettingsProps {
  canvasId: string;
}

const labelRender = (props: any) => {
  const { label, value, title } = props;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`text-white rounded-lg h-[30px] w-[30px] flex items-center justify-center ${
          value === 'off' ? 'bg-gray-500' : 'bg-green-600'
        }`}
      >
        {value === 'off' ? (
          <RiUserForbidLine className="w-5 h-5" />
        ) : (
          <GrLanguage className="w-5 h-5" />
        )}
      </div>
      <div className="text-sm">
        <div>{label}</div>
        <div className="text-xs text-gray-500 leading-none">{title}</div>
      </div>
    </div>
  );
};

const optionRender = (props: any) => {
  const { value, label } = props;
  return (
    <div className="flex items-center gap-2">
      {value === 'off' ? (
        <RiUserForbidLine className="w-4 h-4" />
      ) : (
        <GrLanguage className="w-4 h-4" />
      )}
      {label}
    </div>
  );
};

// Memoized ShareSettings component for better performance
const ShareSettings = React.memo(({ canvasId }: ShareSettingsProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState<ShareAccess>('off');
  const shareLink = `${getClientOrigin()}/share/canvas/${canvasId}`;

  const accessOptions = useMemo(
    () => [
      {
        label: t('shareContent.accessOptions.off'),
        value: 'off',
        title: t('shareContent.accessOptions.offDescription'),
      },
      {
        label: t('shareContent.accessOptions.anyone'),
        value: 'anyone',
        title: t('shareContent.accessOptions.anyoneDescription'),
      },
    ],
    [],
  );

  const buttons = [
    {
      label: 'copyLink',
      icon: <IconLink className="w-4 h-4 flex items-center justify-center" />,
      onClick: () => {
        navigator.clipboard.writeText(shareLink);
        message.success(t('shareContent.copyLinkSuccess'));
      },
      disabled: access === 'off',
    },
    {
      label: 'publishTemplate',
      icon: <MdOutlinePublish className="w-4 h-4 flex items-center justify-center" />,
      onClick: () => {},
      disabled: false,
    },
  ];

  const getCanvasSettingInfo = useCallback(async () => {
    const { data } = await getClient().getCanvasDetail({ query: { canvasId } });
    if (data.data) {
      const { permissions } = data.data;
      setAccess(permissions?.public ? 'anyone' : 'off');
    }
  }, [canvasId]);

  const updateCanvasPermission = useCallback(
    async (value: ShareAccess) => {
      const { data } = await getClient().updateCanvas({
        body: { canvasId, permissions: { public: value === 'anyone' } },
      });
      if (data.success) {
        message.success(t('shareContent.updateCanvasPermissionSuccess'));
        setAccess(value);
      }
    },
    [canvasId, access],
  );

  const handleAccessChange = useCallback(
    (value: ShareAccess) => {
      updateCanvasPermission(value);
    },
    [updateCanvasPermission],
  );

  useEffect(() => {
    getCanvasSettingInfo();
  }, [canvasId]);

  // Memoize content to prevent unnecessary re-renders
  const content = useMemo(
    () => (
      <div className="w-[350px]">
        <div className="flex justify-between items-center p-3">
          <div className="flex items-center gap-2">
            <IconShare className="w-4 h-4 flex items-center justify-center" />
            <span className="font-medium">{t('common.share')}</span>
          </div>
          <Button
            type="text"
            size="small"
            icon={<IconClose className="w-4 h-4 flex items-center justify-center" />}
            onClick={() => setOpen(false)}
          />
        </div>
        <Divider className="my-0" />
        <div className="p-3 pb-5 canvas-share-setting">
          <div className="text-base font-medium mb-2">{t('shareContent.linkShare')}</div>
          <div className="flex items-center justify-between gap-4">
            <Select
              className="flex-1"
              variant="borderless"
              options={accessOptions}
              value={access}
              onChange={handleAccessChange}
              labelRender={labelRender}
              optionRender={optionRender}
            />
          </div>
        </div>
        <div className="px-3 py-4 bg-[#F5F6F7] flex items-center gap-2 rounded-b-lg">
          {buttons.map((button) => (
            <Button
              key={button.label}
              icon={button.icon}
              disabled={button.disabled}
              onClick={button.onClick}
            >
              {t(`shareContent.${button.label}`)}
            </Button>
          ))}
        </div>
      </div>
    ),
    [accessOptions, access, setAccess],
  );

  return (
    <Popover
      className="canvas-share-setting-popover"
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      overlayInnerStyle={{ padding: 0 }}
      content={content}
    >
      <Button type="primary">{t('common.share')}</Button>
    </Popover>
  );
});

ShareSettings.displayName = 'ShareSettings';

export default ShareSettings;
