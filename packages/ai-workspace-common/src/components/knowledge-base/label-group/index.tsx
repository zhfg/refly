import { EntityType, LabelInstance } from '@refly/openapi-schema';
import { useEffect, useState } from 'react';
import { Skeleton, Message as message, Tag, Popconfirm, Button } from '@arco-design/web-react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { LabelModal } from '@refly-packages/ai-workspace-common/components/knowledge-base/label-modal';
import { IconPlus, IconTag } from '@arco-design/web-react/icon';
import './index.scss';

const LabelTag = (props: { label: LabelInstance; deleteLabel: (labelId: string) => Promise<void> }) => {
  const { label, deleteLabel } = props;
  const [popconfirmVisible, setPopconfirmVisible] = useState(false);

  const handleDeleteLabel = async (labelId: string) => {
    setPopconfirmVisible(false);
    deleteLabel(labelId);
  };

  return (
    <Popconfirm
      key={label.labelId}
      title="确认删除该标签吗?"
      popupVisible={popconfirmVisible}
      onCancel={() => setPopconfirmVisible(false)}
      onOk={() => handleDeleteLabel(label.labelId)}
      triggerProps={{ onClickOutside: () => setPopconfirmVisible(false) }}
    >
      <Tag
        closable
        icon={<IconTag />}
        visible={true}
        className="label-group-item"
        onClose={() => setPopconfirmVisible(true)}
      >
        {label.value}
      </Tag>
    </Popconfirm>
  );
};

interface LabelGroupProps {
  entityId: string;
  entityType: EntityType;
}

export const LabelGroup = (props: LabelGroupProps) => {
  const { entityId, entityType } = props;
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<LabelInstance[]>([]);
  const [labelModalVisible, setLabelModalVisible] = useState(false);

  const fetchEntityLabels = async () => {
    setLoading(true);
    const { data, error } = await getClient().listLabelInstances({
      query: {
        entityId,
        entityType,
        pageSize: 1000, // big enough
      },
    });
    if (!error) {
      setLabels(data.data ?? []);
    } else {
      console.error(error);
      message.success(`获取标签失败`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntityLabels();
  }, [entityId, entityType]);

  const deleteLabel = async (labelId: string) => {
    const { error } = await getClient().deleteLabelInstance({
      body: { labelId },
    });
    if (error) {
      console.error(error);
      message.success(`标签删除失败`);
    } else {
      setLabels(labels.filter((label) => label.labelId !== labelId));
      message.success(`标签删除成功`);
    }
  };

  if (loading) {
    return (
      <div className="label-group">
        <Skeleton animation text={{ rows: 1, width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="label-group">
      {labels.map((label) => (
        <LabelTag key={label.labelId} label={label} deleteLabel={deleteLabel} />
      ))}
      <Button
        size="mini"
        title="添加标签"
        style={{ borderRadius: '999px' }}
        icon={<IconPlus />}
        onClick={() => setLabelModalVisible(true)}
      >
        {labels?.length === 0 && '点击添加标签'}
      </Button>
      <LabelModal
        visible={labelModalVisible}
        setVisible={setLabelModalVisible}
        entityType={entityType}
        entityId={entityId}
        handleAddLabels={(newLabels) => {
          setLabels([...labels, ...newLabels]);
        }}
      />
    </div>
  );
};
