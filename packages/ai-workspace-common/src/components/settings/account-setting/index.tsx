import { Button, Form, Input, Upload, Modal, Message as message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

// styles
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
// components
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

const FormItem = Form.Item;

export const AccountSetting = () => {
  const [form] = Form.useForm();
  const userStore = useUserStore();
  const { t } = useTranslation();

  const [nameStatus, setNameStatus] = useState<'error' | 'success' | 'warning' | 'validating'>('success');
  const [nameMessage, setNameMessage] = useState('');

  const checkUsername = async (name: string) => {
    try {
      const { data } = await getClient().checkUsername({ query: { name } });
      return data?.data?.available;
    } catch (error) {
      return false;
    }
  };

  const validateName = async (value: string) => {
    if (!value) {
      setNameStatus('error');
      setNameMessage(t('settings.account.namePlaceholder'));
      return;
    }
    if (!/^[a-zA-Z0-9_]{1,30}$/.test(value)) {
      setNameStatus('error');
      setNameMessage(t('settings.account.nameValidationError'));
      return;
    }
    setNameMessage(t(''));
    const isAvailable = await checkUsername(value);
    if (!isAvailable) {
      setNameStatus('error');
      setNameMessage(t('settings.account.usernameInvalid'));
    } else {
      setNameStatus('success');
      setNameMessage('');
    }
  };

  const debouncedValidateName = useDebouncedCallback(validateName, 300);

  const handleUpdate = () => {
    if (nameStatus === 'error') {
      return;
    }
    form.validate().then(async (values) => {
      const { name, nickname } = values;
      const { error } = await getClient().updateSettings({
        body: {
          name,
          nickname,
        },
      });
      if (error) {
        console.log(error);
        message.error(t('settings.account.updateError'));
        return;
      }
      message.success(t('settings.account.updateSuccess'));
      userStore.setUserProfile({ ...userStore.userProfile, name, nickname });
    });
  };

  useEffect(() => {
    form.setFieldsValue({
      ...userStore.userProfile,
      avatar: [
        {
          uid: '-1',
          url: userStore.userProfile?.avatar,
          name: userStore.userProfile?.avatar,
        },
      ],
    });
  }, [userStore.userProfile]);

  return (
    <div className="account-setting">
      <div className="account-setting-content">
        <Form form={form} style={{ width: 600 }} layout="vertical" size="large">
          <FormItem label={t('settings.account.avatar')} field="avatar" triggerPropName="fileList" initialValue={[]}>
            <Upload
              listType="picture-card"
              disabled
              name="files"
              action="/"
              limit={1}
              onPreview={(file) => {
                Modal.info({
                  title: t('settings.account.avatar'),
                  content: (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={file.url || URL.createObjectURL(file.originFile)}
                        style={{
                          maxWidth: '100%',
                        }}
                      ></img>
                    </div>
                  ),
                });
              }}
            />
          </FormItem>

          <FormItem
            label={t('settings.account.name')}
            field="name"
            required
            validateStatus={nameStatus}
            help={nameMessage}
            rules={[{ required: true, message: t('settings.account.namePlaceholder') }]}
          >
            <Input
              maxLength={30}
              showWordLimit
              addBefore="@"
              placeholder={t('settings.account.namePlaceholder')}
              onChange={(value) => {
                debouncedValidateName(value);
              }}
            />
          </FormItem>

          <FormItem
            label={t('settings.account.nickname')}
            field="nickname"
            required
            rules={[{ required: true, message: t('settings.account.nicknamePlaceholder') }]}
          >
            <Input maxLength={30} showWordLimit placeholder={t('settings.account.nicknamePlaceholder')} />
          </FormItem>

          <FormItem
            label={t('settings.account.email')}
            field="email"
            required
            disabled
            rules={[{ required: true, message: t('settings.account.nicknamePlaceholder') }]}
          >
            <Input placeholder={t('settings.account.emailPlaceholder')} />
          </FormItem>

          <div className="account-setting-update">
            <Button type="primary" onClick={handleUpdate}>
              {t('settings.account.update')}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
