import { Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Spin } from 'antd';
import { CanvasNodeData, ResponseNodeMeta, CanvasNode } from './types';
import { Node } from '@xyflow/react';
import { useEffect, useState, useCallback } from 'react';
import { CustomHandle } from './custom-handle';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { EDGE_STYLES } from '../constants';
import { getNodeCommonStyles } from './index';
import { ActionButtons } from './action-buttons';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/use-delete-node';
import { useInsertToDocument } from '@refly-packages/ai-workspace-common/hooks/use-insert-to-document';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/use-create-document';
import { useAddToChatHistory } from '@refly-packages/ai-workspace-common/hooks/use-add-to-chat-history';
import { IconCanvas } from '@refly-packages/ai-workspace-common/components/common/icon';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

type SkillResponseNode = Node<CanvasNodeData<ResponseNodeMeta>, 'skillResponse'>;

export const SkillResponseNode = (props: NodeProps<SkillResponseNode>) => {
  const { data, selected, id } = props;
  const [isHovered, setIsHovered] = useState(false);
  const { edges } = useCanvasControl();
  const { setEdges } = useReactFlow();

  // console.log('data', data);

  const { title, contentPreview, metadata } = data;
  const { status, modelName, steps } = metadata ?? {};

  // Get query and response content from result
  const query = title ?? 'Loading...';
  const content = contentPreview || steps?.map((step) => step.content).join('\n');

  // Check if node has any connections
  const isTargetConnected = edges?.some((edge) => edge.target === id);
  const isSourceConnected = edges?.some((edge) => edge.source === id);

  // Handle node hover events
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: EDGE_STYLES.hover,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id || edge.target === id) {
          return {
            ...edge,
            style: EDGE_STYLES.default,
          };
        }
        return edge;
      }),
    );
  }, [id, setEdges]);

  const { getNode } = useReactFlow();
  const handleAddToChatHistory = useAddToChatHistory(getNode(id) as NodeItem);

  const handleRerun = useCallback(() => {
    // Implement rerun logic
    console.log('Rerun:', id);
  }, [id]);

  const runtime = getRuntime();
  const isWeb = runtime === 'web';
  const handleInsertToDoc = useInsertToDocument(data.entityId);

  const handleDelete = useDeleteNode(
    {
      id,
      type: 'skillResponse',
      data,
      position: { x: 0, y: 0 },
    } as CanvasNode,
    'skillResponse',
  );

  const handleHelpLink = useCallback(() => {
    // Implement help link logic
    console.log('Open help link');
  }, []);

  const handleAbout = useCallback(() => {
    // Implement about logic
    console.log('Show about info');
  }, []);

  const { debouncedCreateDocument, isCreating } = useCreateDocument();

  const handleCreateDocument = useCallback(async () => {
    // TODO: fix actual content
    await debouncedCreateDocument(data?.title ?? modelName, String(content), {
      sourceNodeId: data.entityId,
      addToCanvas: true,
    });
  }, [content, debouncedCreateDocument, data.entityId, data?.title, modelName]);

  return (
    <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isWeb && (
        <ActionButtons
          type="skill-response"
          onAddToChatHistory={handleAddToChatHistory}
          onRerun={handleRerun}
          onInsertToDoc={() => handleInsertToDoc('insertBlow')}
          onCreateDocument={handleCreateDocument}
          onDelete={handleDelete}
          onHelpLink={handleHelpLink}
          onAbout={handleAbout}
          isCompleted={metadata?.status === 'finish'}
          isCreatingDocument={isCreating}
        />
      )}

      {/* Main Card Container */}
      <div
        className={`
          w-[170px]
          h-[186px]
          ${getNodeCommonStyles({ selected, isHovered })}
        `}
      >
        <Spin spinning={status === 'executing' && !contentPreview}>
          <CustomHandle
            type="target"
            position={Position.Left}
            isConnected={isTargetConnected}
            isNodeHovered={isHovered}
            nodeType="response"
          />
          <CustomHandle
            type="source"
            position={Position.Right}
            isConnected={isSourceConnected}
            isNodeHovered={isHovered}
            nodeType="response"
          />

          <div className="flex flex-col gap-2">
            {/* Header with Icon and Type */}
            <div className="flex items-center gap-2">
              <div
                className="
                w-6 
                h-6 
                rounded 
                bg-[#F79009]
                shadow-[0px_2px_4px_-2px_rgba(16,24,60,0.06),0px_4px_8px_-2px_rgba(16,24,60,0.1)]
                flex 
                items-center 
                justify-center
                flex-shrink-0
              "
              >
                <IconCanvas className="w-4 h-4 text-white" />
              </div>

              <span
                className="
                text-[13px]
                font-medium
                leading-normal
                text-[rgba(0,0,0,0.8)]
                font-['PingFang_SC']
                truncate
              "
              >
                {modelName}
              </span>
            </div>

            {/* User Query Title */}
            <div
              className="
              text-[13px]
              font-medium
              leading-normal
              text-[rgba(0,0,0,0.8)]
              font-['PingFang_SC']
              line-clamp-2
              overflow-hidden
              text-ellipsis
            "
            >
              {query}
            </div>

            {/* Response Content Preview */}
            <div
              className="
              text-[10px]
              leading-3
              text-[rgba(0,0,0,0.8)]
              font-['PingFang_SC']
              line-clamp-3
              overflow-hidden
              text-ellipsis
            "
            >
              {content}
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
};
