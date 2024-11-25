import { Modal, Form, Input, Message } from '@arco-design/web-react';
import { useState, useEffect } from 'react';
import { useImportProjectModal } from '@refly-packages/ai-workspace-common/stores/import-project-modal';
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';

// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useTranslation } from 'react-i18next';
import { pick } from '@refly-packages/utils/typesafe';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

export const NewProjectModal = () => {
  const { t } = useTranslation();
  const reloadListState = useReloadListState();
  const importProjectModal = useImportProjectModal();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const editProject = importProjectModal.editProject;
  const fetchProjectDetail = useProjectStoreShallow((state) => state.fetchProjectDetail);

  function onOk() {
    form
      .validate()
      .then(async (res) => {
        setConfirmLoading(true);
        let result = null;
        try {
          if (editProject) {
            result = await getClient().updateProject({
              body: {
                projectId: editProject.projectId,
                ...pick(res, ['title', 'description']),
              },
            });
            fetchProjectDetail(editProject.projectId); // re-fetch project detail
          } else {
            result = await getClient().createProject({
              body: res,
            });
          }
          setConfirmLoading(false);
          if (result?.error) {
            Message.error(t(`workspace.newProjectModal.${editProject ? 'editFailed' : 'failed'}`));
          } else {
            importProjectModal.setShowNewProjectModal(false);
            Message.success(t(`workspace.newProjectModal.${editProject ? 'editSuccessful' : 'successful'}`));
            reloadListState.setReloadProjectList(true);
          }
        } catch (error) {
          Message.error(t(`workspace.newProjectModal.${editProject ? 'editFailed' : 'failed'}`));
          setConfirmLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const formItemLayout = {
    labelCol: {
      span: 4,
    },
    wrapperCol: {
      span: 20,
    },
  };

  useEffect(() => {
    if (importProjectModal.showNewProjectModal && editProject) {
      const { title, description } = editProject;
      form.setFieldsValue({ title, description });
    }
  }, [importProjectModal.showNewProjectModal]);

  return (
    <div>
      <Modal
        title={t(`workspace.newProjectModal.${editProject ? 'editModalTitle' : 'modalTitle'}`)}
        visible={importProjectModal.showNewProjectModal}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={onOk}
        confirmLoading={confirmLoading}
        onCancel={() => importProjectModal.setShowNewProjectModal(false)}
      >
        <Form
          {...formItemLayout}
          form={form}
          labelCol={{
            style: { flexBasis: 90 },
          }}
          wrapperCol={{
            style: { flexBasis: 'calc(100% - 90px)' },
          }}
        >
          <FormItem
            label={t('workspace.newProjectModal.title')}
            field="title"
            rules={[{ required: true, message: t('workspace.newProjectModal.titlePlaceholder') }]}
          >
            <Input maxLength={100} showWordLimit placeholder={t('workspace.newProjectModal.titlePlaceholder')} />
          </FormItem>
          <FormItem label={t('workspace.newProjectModal.description')} field="description">
            <TextArea
              placeholder={t('workspace.newProjectModal.descriptionPlaceholder')}
              maxLength={500}
              showWordLimit
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};
