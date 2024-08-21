import React from 'react';
import classNames from 'classnames';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Tag } from '@arco-design/web-react';
import { IconFolder, IconFolderAdd, IconPlus } from '@arco-design/web-react/icon';
import { Collection } from '@refly/openapi-schema';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

import './index.scss';

interface ResourceCollectionListProps {
  collections: Collection[];
}

const ResourceCollectionList = ({ collections = [] }: ResourceCollectionListProps) => {
  const { t } = useTranslation();
  const { jumpToKnowledgeBase } = useKnowledgeBaseJumpNewPath();
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');

  return (
    <div className="mb-4 resource-collection-list">
      {collections.map((coll) => (
        <>
          <Tag
            closable
            className={classNames('resource-collection-list-item', {
              active: coll.collectionId === kbId,
            })}
            icon={<IconFolder />}
            key={coll.collectionId}
            onClick={() => jumpToKnowledgeBase({ kbId: coll.collectionId })}
          >
            {coll.title}
          </Tag>
          <Divider type="vertical" />
        </>
      ))}

      <Button
        size="mini"
        className="bg-transparent"
        title={collections?.length > 0 && t('workspace.resourceCollectionList.addToCollection')}
        style={{ borderRadius: '999px' }}
        icon={<IconFolderAdd />}
      >
        {collections?.length === 0 && t('workspace.resourceCollectionList.addToCollection')}
      </Button>
    </div>
  );
};

export default ResourceCollectionList;
