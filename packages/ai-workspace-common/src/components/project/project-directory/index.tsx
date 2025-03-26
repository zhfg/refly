import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { Layout, Button, Avatar, Divider, Typography, Collapse, List } from 'antd';
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
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { AiOutlineMenuFold } from 'react-icons/ai';
import { CreateProjectModal } from '@refly-packages/ai-workspace-common/components/project/project-create';
import Logo from '@/assets/logo.svg';
import { useState } from 'react';
import './index.scss';

const { Text, Paragraph } = Typography;

const iconClassName = 'w-4 h-4 flex items-center justify-center';

const ProjectSettings = ({
  source,
  setCollapse,
}: {
  source: 'sider' | 'popover';
  setCollapse: (collapse: boolean) => void;
}) => {
  const navigate = useNavigate();
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

      <div className="py-4 cursor-pointer" onClick={handleEditSettings}>
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Refly" className="w-10 h-10 rounded-md" />
          <div className="flex flex-col">
            <span className="text-sm">团队运营知识库</span>
            <div className="flex items-center gap-2 pt-1">
              <Avatar
                size="small"
                className="w-[20px] h-[20px]"
                icon={<IconUser className={iconClassName} />}
              />
              <span className="text-xs text-gray-500">ch@refly.ai</span>
            </div>
          </div>
        </div>

        <Paragraph className="text-xs text-gray-400 py-2 pb-0 pt-3">快来填写描述吧～</Paragraph>

        <Divider className="my-2" />
        <div className="flex items-center justify-between gap-2 font-medium text-xs text-gray-400">
          <span>instructions</span>
          <Button
            type="text"
            size="small"
            icon={<IconEdit className={cn(iconClassName, 'text-gray-500')} />}
          />
        </div>
      </div>

      <CreateProjectModal
        mode="edit"
        title="创建项目"
        visible={createProjectModalVisible}
        setVisible={setCreateProjectModalVisible}
      />
    </div>
  );
};

// Canvas菜单组件
const CanvasMenu = () => {
  const [canvasList] = useState([
    { id: '1', title: 'Refly 产品快速上手指南' },
    { id: '2', title: 'jina reader 支持本地 sdk 或者 api 调用' },
    { id: '3', title: 'Refly 产品快速上手指南' },
    { id: '4', title: 'jina reader 支持本地 sdk 或者 api 调用' },
    { id: '5', title: 'Refly 产品快速上手指南' },
    { id: '6', title: 'jina reader 支持本地 sdk 或者 api 调用' },
  ]);

  return (
    <Collapse
      defaultActiveKey={['canvas']}
      ghost
      expandIconPosition="end"
      className="bg-white custom-collapse"
      items={[
        {
          key: 'canvas',
          label: <span className="text-sm font-medium">Canvas</span>,
          children: (
            <div className="flex flex-col">
              <Button
                type="text"
                className="flex items-center justify-start mb-2 text-blue-500 hover:text-blue-600"
                icon={<IconPlus className={cn(iconClassName, 'text-blue-500')} />}
              >
                <span className="text-[13px]">新建 Canvas</span>
              </Button>
              <div className="max-h-[20vh] overflow-y-auto px-3">
                <List
                  itemLayout="horizontal"
                  split={false}
                  dataSource={canvasList}
                  renderItem={(item) => (
                    <List.Item className="!py-2 !px-1 rounded-md hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <IconCanvas className={cn(iconClassName, 'text-gray-500')} />
                        <Text className="w-[120px] text-[13px] text-gray-700 truncate">
                          {item.title}
                        </Text>
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
const SourcesMenu = () => {
  const [sourceList] = useState([
    { id: '1', title: 'Refly 产品快速上手指南' },
    { id: '2', title: 'Refly AI Canvas 设计指南' },
    { id: '3', title: 'Aerobic Exercise Improves' },
    { id: '4', title: '知识博主严伯钧' },
    { id: '5', title: '年度 MRR 分析报告' },
  ]);

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
            label: <span className="text-sm font-medium">Sources</span>,
            children: (
              <div className="h-full flex flex-col px-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Sources 详情</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<IconPlus className={cn(iconClassName, 'text-gray-500')} />}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<IconSearch className={cn(iconClassName, 'text-gray-500')} />}
                    />
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                  <List
                    itemLayout="horizontal"
                    split={false}
                    dataSource={sourceList}
                    renderItem={(item) => (
                      <List.Item className="!py-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <IconUser className={cn(iconClassName, 'text-gray-500')} />
                          <span className="text-[13px] text-gray-700">{item.title}</span>
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
  return (
    <Layout.Sider
      width={source === 'sider' ? (collapse ? 0 : 220) : 220}
      className={cn(
        'border border-solid border-gray-100 bg-white shadow-sm',
        source === 'sider' ? 'h-[calc(100vh)]' : 'h-[calc(100vh-100px)] rounded-r-lg',
      )}
    >
      <div className="project-directory flex h-full flex-col py-2 overflow-y-auto">
        <ProjectSettings source={source} setCollapse={setCollapse} />
        <CanvasMenu />
        <SourcesMenu />
      </div>
    </Layout.Sider>
  );
};
