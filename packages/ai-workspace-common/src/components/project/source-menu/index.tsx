import { AddSources } from '@refly-packages/ai-workspace-common/components/project/add-sources';

import { useTranslation } from 'react-i18next';
import { useState, useMemo, useCallback } from 'react';
import { Document, Resource } from '@refly/openapi-schema';
import {
  Popconfirm,
  Button,
  Checkbox,
  Skeleton,
  List,
  Empty,
  Collapse,
  Input,
  message,
  Typography,
} from 'antd';
import {
  IconDelete,
  IconRemove,
  IconClose,
  IconPlus,
  IconSearch,
  IconMoreHorizontal,
  IconCanvas,
  IconUser,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { SelectedItems } from '@refly-packages/ai-workspace-common/components/project/add-sources';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { sourceObject } from '@refly-packages/ai-workspace-common/components/project/project-directory';
import cn from 'classnames';
import { iconClassName } from '@refly-packages/ai-workspace-common/components/project/project-directory';

const { Text } = Typography;

export const SourcesMenu = ({
  sourceList,
  projectId,
  onUpdatedItems,
  isFetching,
  documentCount,
  resourceCount,
}: {
  sourceList?: Array<sourceObject>;
  projectId: string;
  onUpdatedItems?: () => void;
  isFetching: boolean;
  documentCount: number;
  resourceCount: number;
}) => {
  const { t } = useTranslation();

  const [selectedSources, setSelectedSources] = useState<SelectedItems[]>([]);
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [addSourcesVisible, setAddSourcesVisible] = useState(false);

  const handleSourceHover = (id: string | null) => {
    if (!isMultiSelectMode) {
      setHoveredSourceId(id);
    }
  };

  const toggleSourceSelection = (item: sourceObject) => {
    setSelectedSources((prev) => {
      if (prev.some((source) => source.entityId === item.entityId)) {
        return prev.filter((source) => source.entityId !== item.entityId);
      }
      setIsMultiSelectMode(true);
      return [...prev, item];
    });
  };

  const exitMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedSources([]);
    setHoveredSourceId(null);
  }, []);

  const toggleSearchMode = useCallback(() => {
    setIsSearchMode((prev) => !prev);
    if (isSearchMode) {
      setSearchValue('');
    }
  }, [isSearchMode]);

  const deleteSelectedSources = useCallback(() => {
    message.success(`已删除 ${selectedSources.length} 个来源`);
    exitMultiSelectMode();
  }, [selectedSources, exitMultiSelectMode]);

  const removeSelectedSourcesFromProject = useCallback(async () => {
    const res = await getClient().updateProjectItems({
      body: {
        projectId,
        items: selectedSources.map((item) => ({
          entityType: item.entityType,
          entityId: item.entityId,
        })),
      },
    });
    const { data } = res || {};
    if (data?.success) {
      setSelectedSources([]);
      setHoveredSourceId(null);
      message.success(t('project.action.removeItemsSuccess'));
      onUpdatedItems?.();
    }
  }, [selectedSources, projectId, t, onUpdatedItems]);

  const filteredSourceList = useMemo(() => {
    if (!searchValue) return sourceList;
    return sourceList.filter((item) =>
      item.title.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue, sourceList]);

  const handleAddSource = () => {
    setAddSourcesVisible(true);
  };

  const headerActions = useMemo(() => {
    if (isSearchMode || isMultiSelectMode) {
      return (
        <>
          {isMultiSelectMode && (
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="text-xs text-gray-500">
                {t('project.sourceList.selectedCount', { count: selectedSources.length })}
              </div>
              <div className="flex items-center gap-2">
                <Popconfirm
                  title={t('project.sourceList.deleteConfirm')}
                  onConfirm={deleteSelectedSources}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<IconDelete className={cn(iconClassName, 'text-red-500')} />}
                  />
                </Popconfirm>

                <Popconfirm
                  title={t('project.sourceList.removeConfirm')}
                  onConfirm={removeSelectedSourcesFromProject}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<IconRemove className={cn(iconClassName, 'text-gray-500')} />}
                  />
                </Popconfirm>
                <Button
                  type="text"
                  size="small"
                  icon={<IconClose className={cn(iconClassName, 'text-gray-500')} />}
                  onClick={exitMultiSelectMode}
                />
              </div>
            </div>
          )}

          {isSearchMode && (
            <div className="flex items-center gap-2 w-full justify-between mt-2">
              <Input
                autoFocus
                type="text"
                className="text-xs px-2 py-1 border border-gray-200 rounded-md flex-grow focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t('project.sourceList.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Button
                type="text"
                size="small"
                icon={<IconClose className={cn(iconClassName, 'text-gray-500')} />}
                onClick={toggleSearchMode}
              />
            </div>
          )}
        </>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          type="text"
          size="small"
          icon={<IconPlus className={cn(iconClassName, 'text-gray-500')} />}
          onClick={handleAddSource}
        />
        <Button
          type="text"
          size="small"
          icon={<IconSearch className={cn(iconClassName, 'text-gray-500')} />}
          onClick={toggleSearchMode}
        />
      </div>
    );
  }, [
    isMultiSelectMode,
    isSearchMode,
    searchValue,
    deleteSelectedSources,
    exitMultiSelectMode,
    toggleSearchMode,
    handleAddSource,
  ]);

  const getItemIcon = useCallback((item: Document | Resource) => {
    return 'docId' in item ? (
      <IconCanvas className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 flex items-center justify-center" />
    ) : (
      <IconUser className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 flex items-center justify-center" />
    );
  }, []);

  return (
    <div className="flex-grow overflow-y-auto min-h-[150px]">
      <Collapse
        defaultActiveKey={['sources']}
        ghost
        expandIconPosition="end"
        className="bg-white sources-collapse"
        items={[
          {
            key: 'sources',
            label: <span className="text-sm font-medium">{t('project.source')}</span>,
            children: (
              <div className="h-full flex flex-col">
                <div
                  className={`mb-2 px-3 ${
                    isMultiSelectMode || isSearchMode ? '' : 'flex justify-between items-center'
                  }`}
                >
                  <div className="text-[10px] text-gray-500">
                    {t('project.sourceList.sourceCount', {
                      resourceCount,
                      documentCount,
                    })}
                  </div>
                  {headerActions}
                </div>
                <div className="flex-grow overflow-y-auto px-3">
                  {isFetching ? (
                    <div className="flex justify-center h-full pt-4">
                      <Skeleton active paragraph={{ rows: 8 }} title={false} />
                    </div>
                  ) : (
                    <List
                      itemLayout="horizontal"
                      split={false}
                      dataSource={filteredSourceList}
                      locale={{
                        emptyText: (
                          <Empty
                            className="text-xs my-2"
                            imageStyle={{
                              display: 'none',
                            }}
                            image={null}
                            description={t('common.empty')}
                          >
                            <Button
                              size="small"
                              type="default"
                              className="text-xs"
                              icon={
                                <IconPlus size={12} className="flex items-center justify-center" />
                              }
                              onClick={handleAddSource}
                            >
                              {t('project.addSource')}
                            </Button>
                          </Empty>
                        ),
                      }}
                      renderItem={(item) => {
                        return (
                          <List.Item
                            className={cn(
                              '!py-2 !pl-1 !pr-2 my-1 rounded-md hover:bg-gray-50 cursor-pointer relative group',
                              selectedSources.some((source) => source.entityId === item.entityId) &&
                                'bg-gray-50',
                            )}
                            onMouseEnter={() => handleSourceHover(item.entityId)}
                            onMouseLeave={() => handleSourceHover(null)}
                          >
                            <div className="flex items-center gap-1 w-full">
                              <div
                                className="flex items-center gap-1.5 flex-grow"
                                onClick={() => toggleSourceSelection(item)}
                              >
                                {getItemIcon(item)}
                                <Text
                                  className="text-[13px] w-[120px] text-gray-700"
                                  ellipsis={{
                                    tooltip: true,
                                  }}
                                >
                                  {item.title}
                                </Text>
                              </div>
                              <div
                                className={cn(
                                  'flex-shrink-0 flex items-center gap-1 transition-opacity duration-200',
                                  isMultiSelectMode || hoveredSourceId === item.entityId
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              >
                                <Checkbox
                                  checked={selectedSources.some(
                                    (source) => source.entityId === item.entityId,
                                  )}
                                  onChange={() => toggleSourceSelection(item)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {!isMultiSelectMode && (
                                  <IconMoreHorizontal className="w-4 h-3 text-gray-500 font-bond hover:text-green-600" />
                                )}
                              </div>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      <AddSources
        visible={addSourcesVisible}
        setVisible={setAddSourcesVisible}
        projectId={projectId}
        existingItems={sourceList?.map((item) => item.entityId) || []}
        onSuccess={() => {
          onUpdatedItems();
        }}
      />
    </div>
  );
};
