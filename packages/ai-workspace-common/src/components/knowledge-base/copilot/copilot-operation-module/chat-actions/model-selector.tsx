import React, { useEffect, useMemo } from 'react';
import { Button, Dropdown, Link, Menu, Tag, Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { IconDown } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';

import { PiWarningCircleBold } from 'react-icons/pi';
import OpenAIIcon from '@refly-packages/ai-workspace-common/assets/openai.svg';
import AnthropicIcon from '@refly-packages/ai-workspace-common/assets/anthropic.svg';
import { ModelInfo, TokenUsageMeter } from '@refly/openapi-schema';

const providerIcons = {
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
};

export const ModelSelector = () => {
  const { t } = useTranslation();

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

  const droplist = useMemo(() => {
    return (
      <Menu
        onClickMenuItem={(key) => {
          const model = modelList.find((model) => model.name === key);
          if (model) {
            setSelectedModel(model);
          }
        }}
      >
        {modelList.map((model) => {
          const disabled = isModelDisabled(tokenUsage, model);
          const hintText = disabled ? t(`copilot.modelSelector.quotaExceeded.${model.tier}.${planTier}`) : '';
          const hoverContent =
            planTier === 'free' ? (
              <Button type="primary" onClick={() => setSubscribeModalVisible(true)}>
                {hintText}
              </Button>
            ) : (
              <Link href="/settings?tab=subscription">{hintText}</Link>
            );

          return (
            <Menu.Item key={model.name} disabled={disabled} className="text-xs h-8 leading-8">
              <Tooltip position="right" disabled={!disabled} content={hoverContent} color="white">
                <div className="flex items-center">
                  <img className="w-4 h-4 mr-2" src={providerIcons[model.provider]} alt={model.provider} />
                  {model.label + ' '}
                  {model.tier === 't1' && planTier === 'free' && (
                    <Tag
                      color="orange"
                      size="small"
                      className="text-xs cursor-pointer"
                      onClick={() => setSubscribeModalVisible(true)}
                    >
                      PRO
                    </Tag>
                  )}
                </div>
              </Tooltip>
            </Menu.Item>
          );
        })}
      </Menu>
    );
  }, [modelList, tokenUsage]);

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
    try {
      const { data, error } = await getClient().getSubscriptionUsage();
      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setTokenUsage(data.data?.token);
      }
    } catch (error) {
      console.error(error);
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
    <Dropdown droplist={droplist} trigger="click" getPopupContainer={getPopupContainer}>
      <span className={classNames('model-selector', 'chat-action-item')}>
        <IconDown />
        {selectedModel ? (
          <>
            <img className="w-3 h-3 mx-1" src={providerIcons[selectedModel?.provider]} alt={selectedModel?.provider} />
            {selectedModel?.label}
          </>
        ) : (
          <>
            <PiWarningCircleBold className="text-yellow-600" />
            <span className="text-yellow-600">{t('copilot.modelSelector.noModelAvailable')}</span>
          </>
        )}
      </span>
    </Dropdown>
  );
};
