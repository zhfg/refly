import React, { useState } from 'react';
import { Modal, Typography, Radio, Space, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { UILocaleList } from '../ui-locale-list';
import { OutputLocaleList } from '../output-locale-list';
import { IconDown, IconSettings } from '@arco-design/web-react/icon';
import { LOCALE } from '@refly/common-types';
import { IconMouse, IconTouchpad } from '@refly-packages/ai-workspace-common/components/common/icon';
import { LuShipWheel } from 'react-icons/lu';

export const SettingsGuideModal = React.memo(() => {
  const { t, i18n } = useTranslation();
  const [canvasMode, setCanvasMode] = useState<'mouse' | 'touchpad'>('mouse');
  const { showSettingsGuideModal, setShowSettingsGuideModal } = useUserStoreShallow((state) => ({
    showSettingsGuideModal: state.showSettingsGuideModal,
    setShowSettingsGuideModal: state.setShowSettingsGuideModal,
  }));

  const handleSave = () => {
    const { localSettings, setLocalSettings } = useUserStore.getState();
    setLocalSettings({
      ...localSettings,
      canvasMode,
    });
    setShowSettingsGuideModal(false);
  };

  return (
    <Modal
      centered
      title={
        <div className="flex items-center gap-2">
          <LuShipWheel className="text-2xl" />
          <span className="text-lg font-medium">{t('settings.guide.title')}</span>
        </div>
      }
      open={showSettingsGuideModal}
      okText={t('common.finish')}
      cancelText={t('common.skip')}
      onOk={handleSave}
      onCancel={() => setShowSettingsGuideModal(false)}
      width={700}
      footer={[
        <Button key="cancel" onClick={() => setShowSettingsGuideModal(false)}>
          {t('common.skip')}
        </Button>,
        <Button key="primary" type="primary" onClick={handleSave}>
          {t('common.finish')}
        </Button>,
      ]}
      className="settings-guide-modal"
    >
      <Space direction="vertical" size="small" className="w-full pt-4">
        {/* Interface Language */}
        <div className="mb-6">
          <Typography.Title level={5} className="mb-2">
            {t('settings.language.uiLocale.title')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="mb-2">
            {t('settings.language.uiLocale.description')}
          </Typography.Paragraph>
          <UILocaleList width={200}>
            <Button>
              {i18n.languages?.[0] === LOCALE.EN ? 'English' : '简体中文'} <IconDown />
            </Button>
          </UILocaleList>
        </div>

        {/* Output Language */}
        <div className="mb-6">
          <Typography.Title level={5} className="mb-2">
            {t('settings.language.outputLocale.title')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="mb-2">
            {t('settings.language.outputLocale.description')}
          </Typography.Paragraph>
          <OutputLocaleList width={200}>
            <Button>
              {t('settings.language.outputLocale.auto')} <IconDown />
            </Button>
          </OutputLocaleList>
        </div>

        {/* Canvas Operation Mode */}
        <div className="mb-6">
          <Typography.Title level={5} className="mb-2">
            {t('canvas.operationMode.title')}
          </Typography.Title>
          <Radio.Group value={canvasMode} onChange={(e) => setCanvasMode(e.target.value)} className="w-full flex gap-4">
            <Radio.Button
              value="mouse"
              className="flex-1 h-auto p-4 border border-gray-200 rounded-lg hover:border-green-400 before:hidden [&.ant-radio-button-wrapper-checked]:border-green-500 [&.ant-radio-button-wrapper-checked]:text-green-500"
            >
              <div className="flex items-start gap-3">
                <IconMouse className="text-2xl pt-1" />
                <div className="flex-1">
                  <div className="text-base font-medium mb-1">{t('canvas.operationMode.mouse')}</div>
                  <div className="text-sm text-gray-500 leading-5">{t('canvas.operationMode.mouseDesc')}</div>
                </div>
              </div>
            </Radio.Button>
            <Radio.Button
              value="touchpad"
              className="flex-1 h-auto p-4 border border-gray-200 rounded-lg hover:border-green-400 before:!hidden [&.ant-radio-button-wrapper-checked]:border-green-500 [&.ant-radio-button-wrapper-checked]:text-green-500"
            >
              <div className="flex items-start gap-3">
                <IconTouchpad className="text-2xl pt-1" />
                <div className="flex-1">
                  <div className="text-base font-medium mb-1">{t('canvas.operationMode.touchpad')}</div>
                  <div className="text-sm text-gray-500 leading-5">{t('canvas.operationMode.touchpadDesc')}</div>
                </div>
              </div>
            </Radio.Button>
          </Radio.Group>
        </div>
      </Space>
    </Modal>
  );
});

SettingsGuideModal.displayName = 'SettingsGuideModal';
