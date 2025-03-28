import { Project } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Typography } from 'antd';
import {
  IconLeft,
  IconShare,
  IconMoreHorizontal,
  IconEdit,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { iconClassName } from '@refly-packages/ai-workspace-common/components/project/project-directory';
import cn from 'classnames';
import { useState } from 'react';
import { AiOutlineMenuFold } from 'react-icons/ai';
import { CreateProjectModal } from '@refly-packages/ai-workspace-common/components/project/project-create';

const { Paragraph } = Typography;
export const ProjectSettings = ({
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
