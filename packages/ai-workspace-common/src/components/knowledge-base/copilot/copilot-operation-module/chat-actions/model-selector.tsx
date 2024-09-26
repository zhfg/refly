import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Dropdown, Menu, Notification } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { IconDown } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

export const ModelSelector = () => {
  const { t } = useTranslation();
  const { userProfile } = useUserStore((state) => ({
    userProfile: state.userProfile,
  }));
  const { selectedModel, setSelectedModel, modelList, setModelList } = useChatStore((state) => ({
    selectedModel: state.selectedModel,
    setSelectedModel: state.setSelectedModel,
    modelList: state.modelList,
    setModelList: state.setModelList,
  }));

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
        {modelList.map((model) => (
          <Menu.Item key={model.name}>{model.label}</Menu.Item>
        ))}
      </Menu>
    );
  }, [modelList]);

  const fetchModelList = async () => {
    try {
      const { userProfile } = useUserStore.getState();
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

  useEffect(() => {
    fetchModelList();
  }, []);

  return (
    <Dropdown droplist={droplist} trigger="click" getPopupContainer={getPopupContainer}>
      <span className={classNames('model-selector')}>
        <IconDown />
        {selectedModel?.label}
      </span>
    </Dropdown>
  );
};
