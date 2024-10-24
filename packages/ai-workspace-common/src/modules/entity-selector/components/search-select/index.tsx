import { useEffect, useRef, useState } from 'react';
import { Button, Divider, Input, Message, Select, Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { SearchDomain } from '@refly/openapi-schema';
import { SelectProps } from '@arco-design/web-react/es/Select/interface';
import { DataFetcher } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/hooks';
import { HiOutlinePlus } from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useDebouncedCallback } from 'use-debounce';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface SearchSelectProps extends SelectProps {
  domain: SearchDomain;
  fetchData?: DataFetcher;
  allowCreateNewEntity?: boolean;
  defaultValue?: any;
}

export const SearchSelect = (props: SearchSelectProps) => {
  const { t } = useTranslation();
  const { domain, fetchData, allowCreateNewEntity = false, defaultValue, onChange, onSelect, ...selectProps } = props;

  const { loadMore, dataList, setDataList, isRequesting, handleValueChange, resetState, mode } = useFetchOrSearchList({
    domain,
    fetchData,
  });
  const refCanTriggerLoadMore = useRef(true);

  const [newEntityName, setNewEntityName] = useState('');

  const options = dataList?.map((item) => ({
    label: <span dangerouslySetInnerHTML={{ __html: item?.title }}></span>,
    value: item?.id,
  }));

  useEffect(() => {
    console.log('defaultValue', defaultValue);
    loadMore();
    return () => {
      resetState();
    };
  }, []);

  const popupScrollHandler = useDebouncedCallback((element: HTMLDivElement) => {
    // Don't trigger loadMore when in search mode
    if (mode === 'search') {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = element;
    const scrollBottom = scrollHeight - (scrollTop + clientHeight);

    if (scrollBottom < 10) {
      if (!isRequesting && refCanTriggerLoadMore.current) {
        loadMore();
        refCanTriggerLoadMore.current = false;
      }
    } else {
      refCanTriggerLoadMore.current = true;
    }
  }, 100);

  const [value, setValue] = useState<any>(defaultValue);
  const [popupVisible, setPopupVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreateNewEntity = async () => {
    if (domain !== 'project') {
      return;
    }

    if (!newEntityName) {
      Message.warning(t('entitySelector.createEntity.newProjectNameIsEmpty'));
      return;
    }

    setCreateLoading(true);
    const { data, error } = await getClient().createProject({
      body: {
        title: newEntityName,
      },
    });
    setCreateLoading(false);

    if (!data || error) {
      Message.error(t('common.putErr'));
      return;
    }

    const { projectId, title } = data.data;
    setDataList([{ id: projectId, title, domain }, ...dataList]);
    setValue(projectId);
    setPopupVisible(false);
    setNewEntityName('');
    onChange?.(projectId, { label: title, value: projectId });
  };

  return (
    <Select
      size="large"
      getPopupContainer={getPopupContainer}
      allowClear
      showSearch
      placeholder={t(`entitySelector.placeholder.${domain}`)}
      defaultValue={defaultValue}
      filterOption={false}
      popupVisible={popupVisible}
      options={options}
      loading={isRequesting}
      onInputValueChange={(value) => {
        handleValueChange(value, [domain]);
      }}
      onClick={() => {
        if (props.disabled) return;
        setPopupVisible(!popupVisible);
      }}
      value={value}
      onChange={(value, option) => {
        setValue(value);
        if (props.mode !== 'multiple') {
          setPopupVisible(false);
        }
        if (onChange) {
          onChange(value, option);
        }
      }}
      onPopupScroll={popupScrollHandler}
      triggerProps={{ onClickOutside: () => setPopupVisible(false) }}
      dropdownRender={(menu) => (
        <div>
          {menu}
          {allowCreateNewEntity && (
            <>
              <Divider style={{ margin: 0 }} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                }}
              >
                <Input
                  allowClear
                  size="small"
                  style={{ marginRight: 8 }}
                  value={newEntityName}
                  onChange={(value) => setNewEntityName(value)}
                  onPressEnter={handleCreateNewEntity}
                />
                <Button
                  style={{ fontSize: 14, padding: '0 2px' }}
                  type="text"
                  size="mini"
                  onClick={handleCreateNewEntity}
                >
                  {createLoading ? (
                    <AiOutlineLoading3Quarters />
                  ) : (
                    <Tooltip
                      getPopupContainer={getPopupContainer}
                      position="right"
                      mini
                      content={t(`entitySelector.createEntity.${domain}`)}
                    >
                      <HiOutlinePlus />
                    </Tooltip>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {...selectProps}
    />
  );
};
