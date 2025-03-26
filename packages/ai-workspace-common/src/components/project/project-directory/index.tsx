import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { Layout, Button, Avatar, Divider, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  IconLeft,
  IconShare,
  IconMoreHorizontal,
  IconUser,
  IconEdit,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { AiOutlineMenuFold } from 'react-icons/ai';
import { CreateProjectModal } from '@refly-packages/ai-workspace-common/components/project/project-create';
import Logo from '@/assets/logo.svg';
import { useState } from 'react';

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
    <div>
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

        <Typography.Paragraph className="text-xs text-gray-400 py-2 pb-0 pt-3">
          快来填写描述吧～
        </Typography.Paragraph>

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
        title="创建项目"
        description="请输入项目名称"
        visible={createProjectModalVisible}
        setVisible={setCreateProjectModalVisible}
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
      <div className="flex h-full flex-col py-2 px-3 overflow-y-auto">
        <ProjectSettings source={source} setCollapse={setCollapse} />
      </div>
    </Layout.Sider>
  );
};
