import { useState } from 'react';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { Avatar, Button, Popconfirm, Typography, Divider, Modal, Form, Input, Message } from '@arco-design/web-react';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';

import { IconUser, IconPlayCircle, IconPlus, IconDelete } from '@arco-design/web-react/icon';

// 样式
import './skill-item.scss';
import { SkillTemplate, SkillInstance } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

type source = 'instance' | 'template';
interface SkillItemProps {
  source: source;
  isInstalled: boolean;
  showExecute?: boolean;
}
interface SkillTempProsp extends SkillItemProps {
  data: SkillTemplate;
}
interface SkillInsProsp extends SkillItemProps {
  data: SkillInstance;
}
export const SkillItem = (props: SkillTempProsp | SkillInsProsp) => {
  const userStore = useUserStore();
  const navigate = useNavigate();
  const { localSettings } = userStore;
  const { handleAddSkillInstance, handleRemoveSkillInstance } = useSkillManagement();
  const { data, isInstalled, showExecute, source } = props;

  const getSkillItemPopupContainer = () => {
    const elem = document.getElementById('skillItem');

    return elem as HTMLElement;
  };

  const goSkillDetail = () => {
    const { skillId } = data;
    if (source === 'template' || !skillId) {
      return;
    }
    navigate(`/skill-detail?skillId=${skillId}`);
  };

  const [visible, setVisible] = useState(false);
  const NewSkillInstanceModal = () => {
    const { t } = useTranslation();
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [form] = Form.useForm();
    const onOk = (res) => {
      form.validate().then((res) => {
        setConfirmLoading(true);
        setTimeout(() => {
          console.log(res);
          Message.success(t('skill.newSkillModal.putSuccess'));
          setVisible(false);
          setConfirmLoading(false);
        }, 1500);
      });
    };
    const formItemLayout = {
      labelCol: {
        span: 4,
      },
      wrapperCol: {
        span: 20,
      },
    };
    return (
      <Modal
        title={t('skill.newSkillModal.title')}
        visible={visible}
        onOk={onOk}
        confirmLoading={confirmLoading}
        onCancel={() => setVisible(false)}
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
            label={t('skill.newSkillModal.name')}
            required
            field="name"
            rules={[{ required: true, message: t('skill.newSkillModal.namePlaceholder') }]}
          >
            <Input placeholder={t('skill.newSkillModal.namePlaceholder')} maxLength={10} showWordLimit />
          </FormItem>
          <FormItem
            label={t('skill.newSkillModal.description')}
            required
            field="description"
            rules={[{ required: true, message: t('skill.newSkillModal.descriptionPlaceholder') }]}
          >
            <TextArea
              placeholder={t('skill.newSkillModal.descriptionPlaceholder')}
              maxLength={500}
              showWordLimit
              style={{ minHeight: 84 }}
            />
          </FormItem>
        </Form>
      </Modal>
    );
  };

  return (
    <div id="skillItem">
      <div className="skill-item" onClick={goSkillDetail}>
        <div className="skill-item__header">
          <div className="skill-item__profile">
            <Avatar size={40} shape="square" style={{ backgroundColor: '#00d0b6', borderRadius: 8 }}>
              {data?.displayName}
            </Avatar>
          </div>
          <div className="skill-item__title">
            <div className="skill-item__title-name">{data?.displayName}</div>
            <div className="skill-item__title-info">
              <span className="skill-item__title-info-item">
                <IconUser /> 99
              </span>
              <Divider type="vertical" />
              <span className="skill-item__title-info-item">
                <IconPlayCircle /> 1k
              </span>
            </div>
          </div>
        </div>

        <div className="skill-item__desc">
          <Typography.Paragraph ellipsis={{ rows: 3 }} style={{ lineHeight: 1.51 }}>
            {data?.description}
          </Typography.Paragraph>
        </div>

        <div className="skill-item__action">
          {showExecute && <IconPlayCircle className="skill-item__action-icon" style={{ strokeWidth: 3 }} />}
          {isInstalled ? (
            <Popconfirm
              title="移除确认？"
              content={`确定移除技能 ${data?.displayName} 吗？`}
              getPopupContainer={getSkillItemPopupContainer}
              onOk={() => {
                handleRemoveSkillInstance(data?.displayName);
              }}
            >
              <IconDelete
                className="skill-item__action-icon"
                style={{ strokeWidth: 3 }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            </Popconfirm>
          ) : (
            <Button
              className="skill-item__action-btn skill-installer-install"
              type="outline"
              onClick={(e) => {
                // handleAddSkillInstance(data?.name);
                e.stopPropagation();
                setVisible(true);
              }}
            >
              <IconPlus />
              从模板创建
            </Button>
          )}
        </div>
      </div>
      <NewSkillInstanceModal />
    </div>
  );
};
