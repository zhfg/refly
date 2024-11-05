import { useEffect } from 'react';

import './index.scss';
import { Item } from './item';

// request
import { RenderItem } from '../../types/item';

import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

export function Home({
  data,
  activeValue,
  setValue,
}: {
  data: RenderItem[];
  displayMode: 'list' | 'search';
  activeValue: string;
  searchValue: string;
  setValue: (val: string) => void;
  showItemDetail: boolean;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    setValue('refly-built-in-ask-ai');
  }, []);

  return (
    <>
      {data?.map((item, index) => (
        <Item
          key={index}
          className={classNames(item?.data?.isSelected ? 'selected' : '', 'search-res-item')}
          value={`${item?.data?.title}__${item?.data?.id}`}
          activeValue={activeValue}
          onSelect={() => {
            item?.onItemClick(item?.data);
          }}
        >
          <span className="search-res-icon">{item?.icon}</span>
          <div className="search-res-container">
            <p
              className="search-res-title"
              dangerouslySetInnerHTML={{ __html: item?.data?.title }}
              title={item?.data?.title.replace(/<[^>]*>/g, '')}
            ></p>
          </div>
        </Item>
      ))}
    </>
  );
}
