import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useMatch, useSearchParams, useParams } from '@refly-packages/ai-workspace-common/utils/router';
import {
  CanvasNode,
  DocumentNodeProps,
  ResourceNodeProps,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { DocumentNode, ResourceNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

export const ContextPreview = ({ item }: { item: CanvasNode }) => {
  const { t } = useTranslation();
  const isShare = useMatch('/share/:shareCode');
  const { shareCode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  console.log('item', item);

  const [content, setContent] = useState<string>((item?.data?.metadata?.contentPreview as string) || '');
  const [isLoading, setIsLoading] = useState(false);

  const getDocumentDetail = async (docId: string) => {
    setIsLoading(true);
    const { data, error } = await getClient().getDocumentDetail({
      query: { docId },
    });
    setIsLoading(false);

    if (error) {
      return;
    }

    setContent(data?.data?.content);
  };

  const getResourceDetail = async (resourceId: string) => {
    setIsLoading(true);
    const { data: newRes, error } = await getClient().getResourceDetail({
      query: {
        resourceId,
      },
    });
    setIsLoading(false);

    if (error) {
      return;
    }

    setContent(newRes?.data?.content);
  };

  const getShareDocument = async (targetDocId?: string) => {
    setIsLoading(true);
    const { data } = await getClient().getShareContent({
      query: {
        shareCode: shareCode || '',
        ...(targetDocId ? { docId: targetDocId } : {}),
      },
    });
    setIsLoading(false);

    if (!data?.success) {
      return;
    }
    const result = data.data;

    setContent(result?.document?.content);
  };

  const handleShareCanvasChange = (canvasId: string) => {
    setSearchParams({ canvasId }, { replace: true });
  };

  useEffect(() => {
    if (item.type === 'document' && !item?.data?.metadata?.sourceType) {
      if (isShare) {
        getShareDocument(item.data?.entityId as string);
      } else {
        getDocumentDetail(item.data?.entityId as string);
      }
    } else if (item.type === 'resource' && !item?.data?.metadata?.sourceType) {
      getResourceDetail(item.data?.entityId as string);
    } else {
      setContent((item.data?.metadata?.contentPreview as string) || '');
    }
  }, [item.id]);

  const renderPreviewNode = () => {
    const commonProps = {
      isPreview: true,
      hideActions: true,
      hideHandles: true,
      data: item.data,
      selected: false,
      id: item.id,
    };

    switch (item.type) {
      case 'document':
        return <DocumentNode {...(commonProps as DocumentNodeProps)} />;
      case 'resource':
        return <ResourceNode {...(commonProps as ResourceNodeProps)} />;
      default:
        return null;
    }
  };

  return (
    <div className="preview-content bg-transparent flex flex-1 justify-center items-center p-4">
      {renderPreviewNode()}
    </div>
  );
};
