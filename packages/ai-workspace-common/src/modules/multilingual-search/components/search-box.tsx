import React from 'react';
import { Input, Select, Space } from 'antd';
import { Search } from 'lucide-react';
import { useMultilingualSearchStoreShallow } from '../stores/multilingual-search';
import './search-box.scss';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useChatStore, MessageIntentContext } from '@refly-packages/ai-workspace-common/stores/chat';

const { Search: AntSearch } = Input;

export const SearchBox: React.FC = () => {
  const {
    query,
    searchLocales,
    outputLocale,
    setQuery,
    setSearchLocales,
    setOutputLocale,
    setProcessingStep,
    setIsSearching,
  } = useMultilingualSearchStoreShallow((state) => ({
    query: state.query,
    searchLocales: state.searchLocales,
    outputLocale: state.outputLocale,
    setQuery: state.setQuery,
    setSearchLocales: state.setSearchLocales,
    setOutputLocale: state.setOutputLocale,
    setProcessingStep: state.setProcessingStep,
    setIsSearching: state.setIsSearching,
  }));
  const chatStore = useChatStore((state) => ({
    setMessageIntentContext: state.setMessageIntentContext,
  }));
  const { sendChatMessage } = useBuildThreadAndRun();

  const handleMultilingualSearch = (userInput?: string) => {
    if (userInput?.trim()?.length === 0) return;

    // Add processing step before sending the message
    setIsSearching(true);
    setProcessingStep();

    const {
      messageIntentContext,
      selectedProject,
      enableWebSearch,
      enableAutoImportWebResource,
      enableKnowledgeBaseSearch,
    } = useChatStore.getState();

    // TODO: later may add more source
    const forceNewConv = true;

    const newMessageIntentContext: Partial<MessageIntentContext> = {
      ...(messageIntentContext || {}),
      isNewConversation: messageIntentContext?.isNewConversation || forceNewConv,
      enableWebSearch,
      enableAutoImportWebResource,
      enableKnowledgeBaseSearch,
      env: {
        runtime: getRuntime(),
        source: MessageIntentSource.MultilingualSearch,
      },
    };

    chatStore.setMessageIntentContext(newMessageIntentContext as MessageIntentContext);

    sendChatMessage({
      tplConfig: null,
      userInput,
      messageIntentContext: newMessageIntentContext as MessageIntentContext,
    });
  };

  return (
    <div className="search-box">
      <div className="search-container">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <AntSearch
            size="large"
            placeholder="Discover the World in Your Language"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={handleMultilingualSearch}
            enterButton={<Search />}
          />
          <Space className="search-options">
            <Select
              mode="multiple"
              style={{ minWidth: 200 }}
              placeholder="Search Languages"
              value={searchLocales.map((l) => l.code)}
              onChange={(values) => {
                setSearchLocales(values.map((v) => searchLocales.find((l) => l.code === v)!));
              }}
              options={searchLocales.map((l) => ({ label: l.name, value: l.code }))}
            />
            <Select
              style={{ minWidth: 150 }}
              placeholder="Display Language"
              value={outputLocale.code}
              onChange={(value) => {
                setOutputLocale(searchLocales.find((l) => l.code === value)!);
              }}
              options={searchLocales.map((l) => ({ label: l.name, value: l.code }))}
            />
          </Space>
        </Space>
      </div>
    </div>
  );
};
