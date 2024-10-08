import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton, Message as message, Tag, Popconfirm, Button } from '@arco-design/web-react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { LabelModal } from '@refly-packages/ai-workspace-common/components/knowledge-base/label-modal';
import { HiPlus } from 'react-icons/hi2';
import { HiOutlineTag } from 'react-icons/hi';
import { EntityType, LabelInstance } from '@refly/openapi-schema';
import './index.scss';

const LabelTag = (props: { label: LabelInstance; deleteLabel: (labelId: string) => Promise<void> }) => {
  const { label, deleteLabel } = props;

  const { t } = useTranslation();
  const [popconfirmVisible, setPopconfirmVisible] = useState(false);

  const handleDeleteLabel = async (labelId: string) => {
    setPopconfirmVisible(false);
    deleteLabel(labelId);
  };

  return (
    <Popconfirm
      key={label.labelId}
      position="bottom"
      title={t('workspace.labelGroup.deleteConfirmText')}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      popupVisible={popconfirmVisible}
      onCancel={() => setPopconfirmVisible(false)}
      onOk={() => handleDeleteLabel(label.labelId)}
      triggerProps={{ onClickOutside: () => setPopconfirmVisible(false) }}
    >
      <Tag
        closable
        icon={<HiOutlineTag style={{ transform: 'translateY(2px)' }} />}
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

  const { t } = useTranslation();
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
      message.success(t('workspace.labelGroup.getLabelFailed'));
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
      message.success(t('workspace.labelGroup.deleteFailed'));
    } else {
      setLabels(labels.filter((label) => label.labelId !== labelId));
      message.success(t('workspace.labelGroup.deleteSuccessful'));
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
        title={labels?.length > 0 ? t('workspace.labelGroup.addLabelTitle') : undefined}
        style={{ borderRadius: '999px' }}
        icon={<HiPlus size={13} strokeWidth={1} />}
        onClick={() => setLabelModalVisible(true)}
      >
        {labels?.length === 0 && t('workspace.labelGroup.addLabel')}
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
