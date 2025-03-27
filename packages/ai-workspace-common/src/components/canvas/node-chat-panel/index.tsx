import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Form } from '@arco-design/web-react';
import { Button } from 'antd';
import { IconClose } from '@arco-design/web-react/icon';

import { ChatInput } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-input';
import { getSkillIcon } from '@refly-packages/ai-workspace-common/components/common/icon';
import { ModelInfo, Skill, SkillRuntimeConfig, SkillTemplateConfig } from '@refly/openapi-schema';
import { ChatActions } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-actions';
import { ContextManager } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager';
import { ConfigManager } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/config-manager';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useTranslation } from 'react-i18next';

// Memoized Header Component
const NodeHeader = memo(
  ({
    selectedSkillName,
    setSelectedSkill,
    readonly,
  }: {
    selectedSkillName?: string;
    setSelectedSkill: (skill: Skill | null) => void;
    readonly: boolean;
  }) => {
    const { t } = useTranslation();
    return (
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#6172F3] shadow-lg flex items-center justify-center flex-shrink-0">
            {getSkillIcon(selectedSkillName, 'w-4 h-4 text-white')}
          </div>
          <span className="text-sm font-medium leading-normal text-[rgba(0,0,0,0.8)] truncate">
            {selectedSkillName
              ? t(`${selectedSkillName}.name`, { ns: 'skill' })
              : t('canvas.skill.askAI')}
          </span>
        </div>
        {selectedSkillName && !readonly && (
          <Button
            type="text"
            size="small"
            className="p-0"
            icon={<IconClose />}
            onClick={() => {
              setSelectedSkill?.(null);
            }}
          />
        )}
      </div>
    );
  },
);

NodeHeader.displayName = 'NodeHeader';

export interface ChatPanelProps {
  readonly?: boolean;
  query: string;
  setQuery: (query: string) => void;
  selectedSkill: Skill | null;
  setSelectedSkill: (skill: Skill | null) => void;
  contextItems: IContextItem[];
  setContextItems: (items: IContextItem[]) => void;
  modelInfo: ModelInfo | null;
  setModelInfo: (modelInfo: ModelInfo | null) => void;
  runtimeConfig: SkillRuntimeConfig;
  setRuntimeConfig: (config: SkillRuntimeConfig) => void;
  tplConfig?: SkillTemplateConfig;
  setTplConfig?: (config: SkillTemplateConfig) => void;
  handleSendMessage: () => void;
  handleAbortAction: () => void;
  handleUploadImage: (file: File) => Promise<any>;
  onInputHeightChange?: () => void;
  className?: string;
}

export const ChatPanel = memo(
  ({
    readonly = false,
    query,
    setQuery,
    selectedSkill,
    setSelectedSkill,
    contextItems = [],
    setContextItems,
    modelInfo,
    setModelInfo,
    runtimeConfig = {},
    setRuntimeConfig,
    tplConfig,
    setTplConfig,
    handleSendMessage,
    handleAbortAction,
    handleUploadImage,
    onInputHeightChange,
    className = '',
  }: ChatPanelProps) => {
    const [form] = Form.useForm();
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const chatInputRef = useRef<HTMLDivElement>(null);

    const handleTplConfigChange = useCallback(
      (config: SkillTemplateConfig) => {
        setTplConfig?.(config);
      },
      [setTplConfig],
    );

    const handleImageUpload = useCallback(
      async (file: File) => {
        const nodeData = await handleUploadImage(file);
        if (nodeData) {
          setContextItems([
            ...contextItems,
            {
              type: 'image',
              ...nodeData,
            },
          ]);
        }
      },
      [contextItems, handleUploadImage, setContextItems],
    );

    // Add useEffect for auto focus
    useEffect(() => {
      if (!readonly) {
        setTimeout(() => {
          if (chatInputRef.current) {
            const textArea = chatInputRef.current.querySelector('textarea');
            if (textArea) {
              textArea.focus();
            }
          }
        }, 100);
      }
    }, [readonly]);

    return (
      <div className={`flex flex-col gap-3 h-full p-3 box-border ${className}`}>
        <NodeHeader
          readonly={readonly}
          selectedSkillName={selectedSkill?.name}
          setSelectedSkill={setSelectedSkill}
        />

        <ContextManager
          className="px-0.5"
          contextItems={contextItems}
          setContextItems={setContextItems}
        />

        <ChatInput
          ref={chatInputRef}
          query={query}
          setQuery={(value) => {
            setQuery(value);
            if (onInputHeightChange) {
              setTimeout(onInputHeightChange, 0);
            }
          }}
          selectedSkillName={selectedSkill?.name}
          inputClassName="px-1 py-0"
          maxRows={20}
          handleSendMessage={handleSendMessage}
          handleSelectSkill={(skill) => {
            setQuery(query?.slice(0, -1));
            setSelectedSkill(skill);
          }}
          onUploadImage={handleImageUpload}
        />

        {selectedSkill?.configSchema?.items?.length > 0 && setTplConfig && (
          <ConfigManager
            key={selectedSkill?.name}
            form={form}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            schema={selectedSkill?.configSchema}
            tplConfig={tplConfig}
            fieldPrefix="tplConfig"
            configScope="runtime"
            onExpandChange={(_expanded) => {
              if (onInputHeightChange) {
                setTimeout(onInputHeightChange, 0);
              }
            }}
            resetConfig={() => {
              const defaultConfig = selectedSkill?.tplConfig ?? {};
              form.setFieldValue('tplConfig', defaultConfig);
            }}
            onFormValuesChange={(_, allValues) => {
              handleTplConfigChange(allValues.tplConfig);
            }}
          />
        )}

        <ChatActions
          query={query}
          model={modelInfo}
          setModel={setModelInfo}
          handleSendMessage={handleSendMessage}
          handleAbort={handleAbortAction}
          onUploadImage={handleImageUpload}
          contextItems={contextItems}
          runtimeConfig={runtimeConfig}
          setRuntimeConfig={setRuntimeConfig}
        />
      </div>
    );
  },
);

ChatPanel.displayName = 'ChatPanel';
