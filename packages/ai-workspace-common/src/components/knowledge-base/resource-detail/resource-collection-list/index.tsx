import React from 'react';
import { Tag } from '@arco-design/web-react';
import { IconFolder, IconFolderAdd } from '@arco-design/web-react/icon';
import { Collection } from '@refly/openapi-schema';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

interface ResourceCollectionListProps {
  collections: Collection[];
}

const ResourceCollectionList = ({ collections }: ResourceCollectionListProps) => {
  const { jumpToKnowledgeBase } = useKnowledgeBaseJumpNewPath();

  return (
    <div className="mt-4">
      {collections.map((coll) => (
        <Tag
          className="bg-transparent cursor-pointer border-gray-200"
          icon={<IconFolder />}
          key={coll.collectionId}
          onClick={() => jumpToKnowledgeBase({ kbId: coll.collectionId })}
        >
          {coll.title}
        </Tag>
      ))}
      <IconFolderAdd />
    </div>
  );
};

export default ResourceCollectionList;
