import { useTranslation } from 'react-i18next';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useMemo, memo, useState, useCallback } from 'react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { SelectedSkillHeader } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/selected-skill-header';
import { ContextManager } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager';
import { ChatInput } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-input';
import {
  ChatActions,
  CustomAction,
} from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-actions';
import { ModelInfo } from '@refly-packages/ai-workspace-common/requests/types.gen';
import { useInvokeAction } from '@refly-packages/ai-workspace-common/hooks/canvas/use-invoke-action';
import {
  convertContextItemsToInvokeParams,
  convertContextItemsToEdges,
} from '@refly-packages/ai-workspace-common/utils/map-context-items';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { IconExit } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useReactFlow } from '@xyflow/react';

interface EditChatInputProps {
  resultId: string;
  contextItems: IContextItem[];
  query: string;
  modelInfo: ModelInfo;
  actionMeta?: {
    icon?: any;
    name?: string;
  };
  setEditMode: (mode: boolean) => void;
  readonly?: boolean;
}

const EditChatInputComponent = (props: EditChatInputProps) => {
  const { resultId, contextItems, query, modelInfo, actionMeta, setEditMode, readonly } = props;

  const { getEdges, getNodes, deleteElements, addEdges } = useReactFlow();
  const [editQuery, setEditQuery] = useState<string>(query);
  const [editContextItems, setEditContextItems] = useState<IContextItem[]>(contextItems);
  const [editModelInfo, setEditModelInfo] = useState<ModelInfo>(modelInfo);
  const { t } = useTranslation();

  const hideSelectedSkillHeader = useMemo(
    () => !actionMeta || actionMeta?.name === 'commonQnA' || !actionMeta?.name,
    [actionMeta?.name],
  );

  const { canvasId } = useCanvasContext();
  const { invokeAction } = useInvokeAction();

  const handleSendMessage = useCallback(() => {
    // Synchronize edges with latest context items
    const nodes = getNodes();
    const currentNode = nodes.find((node) => node.data?.entityId === resultId);
    if (!currentNode) {
      return;
    }

    const edges = getEdges().filter((edge) => edge.target === currentNode.id);
    const { edgesToAdd, edgesToDelete } = convertContextItemsToEdges(resultId, editContextItems, nodes, edges);
    addEdges(edgesToAdd);
    deleteElements({ edges: edgesToDelete });

    const { context, resultHistory } = convertContextItemsToInvokeParams(editContextItems);

    invokeAction({
      resultId,
      input: {
        query: editQuery,
      },
      target: {
        entityId: canvasId,
        entityType: 'canvas',
      },
      modelName: editModelInfo?.name,
      context,
      resultHistory,
      skillName: actionMeta?.name,
    });
    setEditMode(false);
  }, [resultId, editQuery, editModelInfo, editContextItems, actionMeta]);

  const customActions: CustomAction[] = useMemo(
    () => [
      {
        icon: <IconExit />,
        title: t('copilot.chatActions.exitEdit'),
        onClick: () => {
          setEditMode(false);
        },
      },
    ],
    [setEditMode],
  );

  return (
    <div className="ai-copilot-chat-container">
      <div className={cn('border border-solid border-gray-200 rounded-lg')}>
        {!hideSelectedSkillHeader && (
          <SelectedSkillHeader
            readonly={readonly}
            skill={{
              icon: actionMeta?.icon,
              name: actionMeta?.name,
            }}
            className="rounded-t-[7px]"
          />
        )}
        <ContextManager contextItems={editContextItems} setContextItems={setEditContextItems} />
        <ChatInput
          query={editQuery}
          setQuery={setEditQuery}
          selectedSkill={null}
          handleSendMessage={handleSendMessage}
        />
        <ChatActions
          query={editQuery}
          model={editModelInfo}
          setModel={setEditModelInfo}
          handleSendMessage={handleSendMessage}
          handleAbort={() => {}}
          customActions={customActions}
        />

        {/* {skillStore.selectedSkill?.configSchema?.items?.length > 0 && (
      <ConfigManager
        form={form}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        schema={skillStore.selectedSkill?.configSchema}
        tplConfig={skillStore.selectedSkill?.config}
        fieldPrefix="tplConfig"
        configScope="runtime"
        resetConfig={() => {
          form.setFieldValue('tplConfig', skillStore.selectedSkill?.tplConfig || {});
        }}
      />
    )} */}
      </div>
    </div>
  );
};

const arePropsEqual = (prevProps: EditChatInputProps, nextProps: EditChatInputProps) => {
  return (
    prevProps.resultId === nextProps.resultId &&
    prevProps.query === nextProps.query &&
    prevProps.modelInfo === nextProps.modelInfo &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.contextItems === nextProps.contextItems &&
    prevProps.actionMeta?.name === nextProps.actionMeta?.name
  );
};

export const EditChatInput = memo(EditChatInputComponent, arePropsEqual);
