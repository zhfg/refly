import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown, DropdownProps, MenuProps, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconDown } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';

import { PiWarningCircleBold } from 'react-icons/pi';
import { ModelInfo, TokenUsageMeter } from '@refly/openapi-schema';
import { ModelProviderIcons } from '@refly-packages/ai-workspace-common/components/common/icon';

interface ModelSelectorProps {
  dropdownMode?: boolean; // Whether to show as dropdown button
  className?: string;
  placement?: DropdownProps['placement'];
}

export const ModelSelector = ({ placement = 'bottom' }: ModelSelectorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { userProfile } = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
  }));
  const { selectedModel, setSelectedModel, modelList, setModelList } = useChatStoreShallow((state) => ({
    selectedModel: state.selectedModel,
    setSelectedModel: state.setSelectedModel,
    modelList: state.modelList,
    setModelList: state.setModelList,
  }));
  const { tokenUsage, setTokenUsage, setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
    tokenUsage: state.tokenUsage,
    setTokenUsage: state.setTokenUsage,
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));

  const isModelDisabled = (meter: TokenUsageMeter, model: ModelInfo) => {
    if (meter && model) {
      if (model.tier === 't1') {
        return meter.t1TokenUsed >= meter.t1TokenQuota;
      } else if (model.tier === 't2') {
        return meter.t2TokenUsed >= meter.t2TokenQuota;
      }
    }
    return false;
  };
  const planTier = userProfile?.subscription?.planType || 'free';

  const droplist: MenuProps['items'] = modelList.map((model) => {
    const disabled = isModelDisabled(tokenUsage, model);
    const hintText = disabled ? t(`copilot.modelSelector.quotaExceeded.${model.tier}.${planTier}`) : '';
    const hintBtn =
      planTier === 'free' ? (
        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(false);
            setSubscribeModalVisible(true);
          }}
        >
          {hintText}
        </Button>
      ) : (
        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(false);
            navigate('/settings?tab=subscription');
          }}
        >
          {hintText}
        </Button>
      );
    const modelItem = (
      <div className="w-full">
        <div className="flex items-center text-xs">
          <img className="w-4 h-4 mr-2" src={ModelProviderIcons[model.provider]} alt={model.provider} />
          {model.label + ' '}
          {model.tier === 't1' && planTier === 'free' && (
            <Tag
              color="orange"
              className="ml-1 cursor-pointer"
              style={{ fontSize: '10px' }}
              onClick={() => setSubscribeModalVisible(true)}
            >
              PRO
            </Tag>
          )}
        </div>
      </div>
    );

    return {
      key: model.name,
      label: disabled ? (
        <Tooltip destroyTooltipOnHide placement="right" title={hintBtn} color="white">
          {modelItem}
        </Tooltip>
      ) : (
        modelItem
      ),
      disabled,
    };
  });

  const fetchModelList = async () => {
    try {
      if (!userProfile?.uid) {
        return;
      }

      const res = await getClient().listModels();

      if (res?.error) {
        console.error(res.error);
        return;
      }

      if (res?.data) {
        setModelList(res.data?.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTokenUsage = async () => {
    const { userProfile } = useUserStore.getState();
    if (!userProfile) return;

    const { data, error } = await getClient().getSubscriptionUsage();
    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setTokenUsage(data.data?.token);
    }
  };

  useEffect(() => {
    fetchModelList();
    fetchTokenUsage();
  }, []);

  useEffect(() => {
    if (!selectedModel || isModelDisabled(tokenUsage, selectedModel)) {
      const availableModel = modelList.find((model) => !isModelDisabled(tokenUsage, model));
      if (availableModel) {
        setSelectedModel(availableModel);
      } else {
        setSelectedModel(null);
      }
    }
  }, [selectedModel, tokenUsage]);

  return (
    <Dropdown
      menu={{
        items: droplist,
        onClick: ({ key }) => {
          const model = modelList.find((model) => model.name === key);
          if (model) {
            setSelectedModel(model);
          }
        },
      }}
      trigger={['hover']}
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      getPopupContainer={getPopupContainer}
    >
      <span className={classNames('model-selector', 'chat-action-item')}>
        {selectedModel ? (
          <>
            <img
              className="w-3 h-3 mx-1"
              src={ModelProviderIcons[selectedModel?.provider]}
              alt={selectedModel?.provider}
            />
            {selectedModel?.label}
          </>
        ) : (
          <>
            <PiWarningCircleBold className="text-yellow-600" />
            <span className="text-yellow-600">{t('copilot.modelSelector.noModelAvailable')}</span>
          </>
        )}
        <IconDown />
      </span>
    </Dropdown>
  );
};
