import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import {
  Layout,
  Button,
  Divider,
  Typography,
  Collapse,
  List,
  Checkbox,
  message,
  Input,
  Empty,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  IconLeft,
  IconShare,
  IconMoreHorizontal,
  IconUser,
  IconEdit,
  IconCanvas,
  IconSearch,
  IconPlus,
  IconDelete,
  IconClose,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { AiOutlineMenuFold } from 'react-icons/ai';
import { CreateProjectModal } from '@refly-packages/ai-workspace-common/components/project/project-create';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './index.scss';
import { useGetProjectDetail } from '@refly-packages/ai-workspace-common/queries';
import { Canvas, Project, Document, Resource } from '@refly/openapi-schema';

const { Text, Paragraph } = Typography;

const iconClassName = 'w-4 h-4 flex items-center justify-center';

const ProjectSettings = ({
  source,
  setCollapse,
  data,
  onUpdate,
}: {
  source: 'sider' | 'popover';
  setCollapse: (collapse: boolean) => void;
  data: Project;
  onUpdate: (data: Project) => void;
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);

  const handleEditSettings = () => {
    setCreateProjectModalVisible(true);
  };
  return (
    <div className="px-3">
      <div className="flex justify-between items-center">
        <Button
          className="px-1 gap-1 text-sm text-gray-500"
          size="small"
          type="text"
          icon={<IconLeft className={iconClassName} />}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<IconShare className={cn(iconClassName, 'text-gray-500')} />}
          />
          <Button
            type="text"
            size="small"
            icon={<IconMoreHorizontal className={cn(iconClassName, 'text-gray-500')} />}
          />
          {source === 'sider' && (
            <Button
              type="text"
              size="small"
              icon={<AiOutlineMenuFold className={cn(iconClassName, 'text-gray-500')} />}
              onClick={() => setCollapse(true)}
            />
          )}
        </div>
      </div>

      <div className="py-5 cursor-pointer" onClick={handleEditSettings}>
        <div className="flex items-center gap-3">
          <img src={data?.coverUrl} alt="Refly" className="w-10 h-10 rounded-md" />
          <div className="flex flex-col">
            <span className="text-sm">{data?.name || t('common.untitled')}</span>
          </div>
        </div>

        <Paragraph className="text-xs text-gray-400 py-2 pb-0 pt-3" ellipsis={{ rows: 1 }}>
          {data?.description || t('project.noDescription')}
        </Paragraph>

        <Divider className="my-2" />
        <div className="flex items-center justify-between gap-2 font-medium text-xs text-gray-400">
          <span>{t('project.customInstructions')}</span>
          <Button
            type="text"
            size="small"
            icon={<IconEdit className={cn(iconClassName, 'text-gray-500')} />}
          />
        </div>
        {data?.customInstructions && (
          <Paragraph className="text-xs py-1 !mb-0" ellipsis={{ rows: 1 }}>
            {data?.customInstructions}
          </Paragraph>
        )}
      </div>

      <CreateProjectModal
        mode="edit"
        projectId={data?.projectId}
        title={data?.name}
        description={data?.description}
        coverPicture={data?.coverUrl}
        instructions={data?.customInstructions}
        visible={createProjectModalVisible}
        setVisible={setCreateProjectModalVisible}
        onSuccess={(data) => {
          onUpdate(data);
        }}
      />
    </div>
  );
};

// Canvas菜单组件
const CanvasMenu = ({ canvasList }: { canvasList: Canvas[] }) => {
  const { t } = useTranslation();

  const [hoveredCanvasId, setHoveredCanvasId] = useState<string | null>(null);

  const handleCanvasHover = useCallback((id: string | null) => {
    setHoveredCanvasId(id);
  }, []);

  const handleAddCanvas = () => {
    console.log('handleAddCanvas');
  };

  return (
    <Collapse
      defaultActiveKey={['canvas']}
      ghost
      expandIconPosition="end"
      className="bg-white custom-collapse"
      items={[
        {
          key: 'canvas',
          label: <span className="text-sm font-medium">{t('project.canvas')}</span>,
          children: (
            <div className="flex flex-col">
              {canvasList.length > 0 && (
                <Button
                  type="text"
                  className="flex items-center justify-start mb-2 mx-3 !text-green-600"
                  icon={<IconPlus className={cn(iconClassName)} />}
                  onClick={handleAddCanvas}
                >
                  {t('loggedHomePage.siderMenu.newCanvas')}
                </Button>
              )}
              <div className="max-h-[20vh] overflow-y-auto px-3">
                <List
                  itemLayout="horizontal"
                  split={false}
                  dataSource={canvasList}
                  locale={{
                    emptyText: (
                      <Empty
                        className="text-xs my-2"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={t('common.empty')}
                      >
                        <Button
                          type="default"
                          size="small"
                          className="text-xs text-gray-600"
                          icon={<IconPlus size={12} className="flex items-center justify-center" />}
                          onClick={handleAddCanvas}
                        >
                          {t('loggedHomePage.siderMenu.newCanvas')}
                        </Button>
                      </Empty>
                    ),
                  }}
                  renderItem={(item) => (
                    <List.Item
                      className="!py-2 !px-1 rounded-md hover:bg-gray-50 cursor-pointer"
                      onMouseEnter={() => handleCanvasHover(item.canvasId)}
                      onMouseLeave={() => handleCanvasHover(null)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <IconCanvas className={cn(iconClassName, 'text-gray-500')} />
                          <Text className="w-[120px] text-[13px] text-gray-700 truncate">
                            {item.title}
                          </Text>
                        </div>
                        <div
                          className={cn(
                            'transition-opacity duration-200',
                            hoveredCanvasId === item.canvasId ? 'opacity-100' : 'opacity-0',
                          )}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={
                              <IconMoreHorizontal
                                className={cn(iconClassName, 'text-gray-500 hover:text-green-600')}
                              />
                            }
                          />
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
};

// Sources菜单组件
const SourcesMenu = ({ sourcesList }: { sourcesList?: Array<Document | Resource> }) => {
  const { t } = useTranslation();
  // 使用传入的 sourcesList 或默认空数组
  const [sourceList] = useState(sourcesList || []);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSourceHover = (id: string | null) => {
    if (!isMultiSelectMode) {
      setHoveredSourceId(id);
    }
  };

  const toggleSourceSelection = (id: string) => {
    setSelectedSources((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sourceId) => sourceId !== id);
      }
      setIsMultiSelectMode(true);
      return [...prev, id];
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

  // 删除所选sources
  const deleteSelectedSources = useCallback(() => {
    // 这里应该调用API来删除选中的sources
    message.success(`已删除 ${selectedSources.length} 个来源`);
    // 清空选择状态
    exitMultiSelectMode();
  }, [selectedSources, exitMultiSelectMode]);

  const filteredSourceList = useMemo(() => {
    if (!searchValue) return sourceList;
    return sourceList.filter((item) =>
      item.title.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue, sourceList]);

  const handleAddSource = () => {
    console.log('handleAddSource');
  };

  const headerActions = useMemo(() => {
    if (isSearchMode) {
      return (
        <div className="flex items-center gap-2 w-full justify-between mt-2">
          <Input
            autoFocus
            type="text"
            className="text-xs px-2 py-1 border border-gray-200 rounded-md flex-grow focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="搜索Sources..."
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
      );
    }

    if (isMultiSelectMode) {
      return (
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="text-xs text-gray-500">已选择 {selectedSources.length} 项</div>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              size="small"
              icon={<IconDelete className={cn(iconClassName, 'text-gray-500')} />}
              onClick={deleteSelectedSources}
            />
            <Button
              type="text"
              size="small"
              icon={<IconClose className={cn(iconClassName, 'text-gray-500')} />}
              onClick={exitMultiSelectMode}
            />
          </div>
        </div>
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

  // 获取每个项目的 ID
  const getItemId = useCallback((item: Document | Resource) => {
    return 'docId' in item ? item.docId : item.resourceId;
  }, []);

  // 获取每个项目的图标
  const getItemIcon = useCallback((item: Document | Resource) => {
    // 根据类型返回不同的图标
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
                  <div className="text-xs text-gray-500">Sources 详情</div>
                  {headerActions}
                </div>
                <div className="flex-grow overflow-y-auto px-3">
                  <List
                    itemLayout="horizontal"
                    split={false}
                    dataSource={filteredSourceList}
                    locale={{
                      emptyText: (
                        <Empty
                          className="text-xs my-2"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
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
                      const itemId = getItemId(item);
                      return (
                        <List.Item
                          className={cn(
                            '!py-2 !pl-1 !pr-2 my-1 rounded-md hover:bg-gray-50 cursor-pointer relative group',
                            selectedSources.includes(itemId) && 'bg-gray-50',
                          )}
                          onMouseEnter={() => handleSourceHover(itemId)}
                          onMouseLeave={() => handleSourceHover(null)}
                        >
                          <div className="flex items-center gap-1 w-full">
                            <div
                              className="flex items-center gap-1.5 flex-grow"
                              onClick={() => toggleSourceSelection(itemId)}
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
                                isMultiSelectMode || hoveredSourceId === itemId
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            >
                              <Checkbox
                                checked={selectedSources.includes(itemId)}
                                onChange={() => toggleSourceSelection(itemId)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <IconMoreHorizontal className="w-4 h-3 text-gray-500 font-bond hover:text-green-600" />
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

interface ProjectDirectoryProps {
  projectId: string;
  source: 'sider' | 'popover';
}

export const ProjectDirectory = ({ projectId, source }: ProjectDirectoryProps) => {
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  console.log('projectId', projectId);
  const { data: projectDetail } = useGetProjectDetail({ query: { projectId } }, null, {
    enabled: !!projectId,
  });
  const data = projectDetail?.data;
  const [projectData, setProjectData] = useState(data);
  const canvases = data?.canvases || [];
  const documents = data?.documents || [];
  const resources = data?.resources || [];

  // 混合并排序 documents 和 resources 数组
  const mergedSources = useMemo(() => {
    // 确保 documents 和 resources 存在
    const docs = documents || [];
    const res = resources || [];

    // 合并两个数组
    const merged = [...docs, ...res];

    // 根据 updatedAt 排序，最新的放在前面
    return merged.sort((a, b) => {
      const dateA = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA; // 降序排列
    });
  }, [documents, resources]);

  useEffect(() => {
    setProjectData(data);
  }, [data]);

  return (
    <Layout.Sider
      width={source === 'sider' ? (collapse ? 0 : 220) : 220}
      className={cn(
        'border border-solid border-gray-100 bg-white shadow-sm',
        source === 'sider' ? 'h-[calc(100vh)]' : 'h-[calc(100vh-100px)] rounded-r-lg',
      )}
    >
      <div className="project-directory flex h-full flex-col py-3 overflow-y-auto">
        <ProjectSettings
          source={source}
          setCollapse={setCollapse}
          data={projectData}
          onUpdate={(data) => {
            console.log('data', data);
            setProjectData({ ...projectData, ...data });
          }}
        />
        <CanvasMenu canvasList={canvases} />
        <SourcesMenu sourcesList={mergedSources} />
      </div>
    </Layout.Sider>
  );
};
