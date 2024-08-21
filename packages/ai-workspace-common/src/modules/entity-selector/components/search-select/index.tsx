import React, { useEffect } from 'react';
import { Button, Select } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { SearchDomain } from '@refly/openapi-schema';
import { SelectProps } from '@arco-design/web-react/es/Select/interface';
import { DataFetcher } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/hooks';

interface SearchSelectProps extends SelectProps {
  domain: SearchDomain;
  fetchData?: DataFetcher;
  allowCreateNewEntity?: boolean;
}

export const SearchSelect = (props: SearchSelectProps) => {
  const { t } = useTranslation();
  const { domain, fetchData, allowCreateNewEntity = false, ...selectProps } = props;

  const { loadMore, hasMore, dataList, isRequesting, handleValueChange, mode, resetState } = useFetchOrSearchList({
    domain,
    fetchData,
  });

  const options = dataList?.map((item) => ({
    label: <span dangerouslySetInnerHTML={{ __html: item?.title }}></span>,
    value: item?.id,
  }));

  if (allowCreateNewEntity) {
    options.unshift({
      label: <span>{t(`entitySelector.createEntity.${domain}`)}</span>,
      value: `new-${domain}`,
    });
  }

  useEffect(() => {
    loadMore();
    return () => {
      resetState();
    };
  }, []);

  return (
    <Select
      size="large"
      allowClear
      showSearch
      placeholder={t(`entitySelector.placeholder.${domain}`)}
      filterOption={false}
      onInputValueChange={(value) => {
        handleValueChange(value, [domain]);
      }}
      options={options}
      dropdownRender={(menu) => (
        <div>
          {menu}
          {mode === 'fetch' && hasMore ? (
            <div className="search-load-more">
              <Button type="text" loading={isRequesting} onClick={() => loadMore()}>
                {t('common.loadMore')}
              </Button>
            </div>
          ) : null}
        </div>
      )}
      {...selectProps}
    />
  );
};
