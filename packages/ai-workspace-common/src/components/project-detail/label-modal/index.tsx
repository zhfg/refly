import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, InputTag, Message, Select } from '@arco-design/web-react';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { EntityType, LabelInstance } from '@refly/openapi-schema';

const FormItem = Form.Item;
const { Option } = Select;

interface LabelModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  entityType: EntityType;
  entityId: string;
  handleAddLabels?: (labels: LabelInstance[]) => void;
}

export const LabelModal = (props: LabelModalProps) => {
  const { visible, setVisible, entityType, entityId, handleAddLabels } = props;
  const { t } = useTranslation();
  const { dataList, loadMore } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listLabelClasses({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 100, // TODO: support pagination
  });

  const [form] = Form.useForm();

  function onOk() {
    form
      .validate()
      .then(async (res) => {
        console.log(res);
        const { data, error } = await getClient().createLabelInstance({
          body: {
            labelClassId: res.labelClass,
            valueList: res.valueList,
            entityId,
            entityType,
          },
        });
        if (!error) {
          Message.success(t('workspace.newLabelModal.successful'));
          if (handleAddLabels) {
            handleAddLabels(data.data ?? []);
          }
          form.resetFields('valueList');
        } else {
          Message.error(t('workspace.newLabelModal.failed'));
        }
        setVisible(false);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <Modal
      unmountOnExit
      visible={visible}
      onOk={onOk}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      onCancel={() => setVisible(false)}
      title={t('workspace.newLabelModal.modalTitle')}
    >
      <Form form={form}>
        <FormItem
          field="labelClass"
          label={t('workspace.newLabelModal.labelClass')}
          rules={[{ required: true, message: t('workspace.newLabelModal.labelClassValidateMessage') }]}
        >
          <Select
            placeholder={t('workspace.newLabelModal.labelClassPlaceholder')}
            allowClear
            defaultValue={dataList[0]?.labelClassId}
          >
            {dataList.map((lc) => (
              <Option key={lc.labelClassId} value={lc.labelClassId}>
                {lc.displayName}
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem
          field="valueList"
          label={t('workspace.newLabelModal.valueList')}
          rules={[{ required: true, message: t('workspace.newLabelModal.valueListValidateMessage') }]}
        >
          <InputTag
            allowClear
            saveOnBlur
            defaultValue={[]}
            placeholder={t('workspace.newLabelModal.valueListPlaceholder')}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};
