import { useState, useEffect } from 'react';

// components
import { useTranslation } from 'react-i18next';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
import { SkillJobs } from '@refly-packages/ai-workspace-common/components/skill/skill-jobs';
import { SkillTriggers } from '@refly-packages/ai-workspace-common/components/skill/skill-triggers';
import { InstanceInvokeModal } from '@refly-packages/ai-workspace-common/components/skill/instance-invoke-modal';
import { InstanceDropdownMenu } from '@refly-packages/ai-workspace-common/components/skill/instance-dropdown-menu';
import { NewSkillInstanceModal } from '@refly-packages/ai-workspace-common/components/skill/new-instance-modal';

// store
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

import './index.scss';
import { SkillInstance } from '@refly/openapi-schema';

import { Radio, Avatar, Button, Typography } from '@arco-design/web-react';
import { IconLeft, IconPlayArrow, IconDelete } from '@arco-design/web-react/icon';

const RadioGroup = Radio.Group;

const ContentTab = (props: { val: string; setVal: (val: string) => void }) => {
  const { setVal, val } = props;
  const { t } = useTranslation();
  return (
    <div className="skill-detail__content-tab">
      <RadioGroup
        type="button"
        size="large"
        className="content-tabs"
        defaultValue="jobs"
        onChange={(val) => setVal(val)}
      >
        <Radio value="jobs" style={{ whiteSpace: 'nowrap' }}>
          {t('skill.skillDetail.jobs')}
        </Radio>
        <Radio value="triggers" style={{ whiteSpace: 'nowrap' }}>
          {t('skill.skillDetail.triggers')}
        </Radio>
      </RadioGroup>
      {val === 'triggers' && <Button>添加触发器</Button>}
    </div>
  );
};

const SkillDetail = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get('skillId') as string;

  const [skillDetail, setSkillDetail] = useState<SkillInstance>();
  const [val, setVal] = useState('jobs');
  const [visible, setVisible] = useState(false);

  const [reloadJobList, setReloadJobList] = useState(false);
  const [reloadTriggers, setReloadTriggers] = useState(false);
  const handleGetSkillInstances = async () => {
    const { data, error } = await getClient().listSkillInstances({
      query: {
        skillId,
      },
    });

    if (data?.data) {
      console.log('skill instances', data?.data);
      setSkillDetail(data?.data[0]);
    } else {
      console.log('get skill instances error', error);
    }
  };

  const [invokeModalVisible, setInvokeModalVisible] = useState(false);
  const handleSkillInvoke = () => {
    setInvokeModalVisible(true);
  };

  useEffect(() => {
    handleGetSkillInstances();
  }, []);

  return (
    <div className="skill-detail">
      <div className="skill-detail__header">
        <div className="skill-detail__back" onClick={() => window.history.back()}>
          <IconLeft className="skill-detail__back-icon" />
          返回技能管理
        </div>
      </div>

      <div className="skill-detail__content">
        <div className="skill-detail__content-wrap">
          <div className="skill-detail__content-top">
            <Avatar className="skill-avatar" shape="square" size={140}>
              <img
                alt="avatar"
                src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
              />
            </Avatar>
            <div className="skill-detail__content-top-info">
              <div className="skill-name">{skillDetail?.displayName}</div>
              <Typography.Paragraph className="skill-desc" ellipsis={{ rows: 3 }} style={{ lineHeight: 1.51 }}>
                {skillDetail?.description}
              </Typography.Paragraph>
              <div className="skill-action">
                <Button
                  className="skill-action__invoke"
                  type="primary"
                  style={{ borderRadius: 4 }}
                  onClick={handleSkillInvoke}
                >
                  <IconPlayArrow />
                  {t('skill.skillDetail.run')}
                </Button>
                <InstanceDropdownMenu data={skillDetail} setUpdateModal={(visible) => setVisible(visible)} />
              </div>
            </div>
          </div>

          <div className="skill-detail__content-bottom">
            <ContentTab setVal={setVal} val={val} />
            <div className="skill-detail__content-list">
              {val === 'jobs' ? (
                <SkillJobs reloadList={reloadJobList} setReloadList={setReloadJobList} />
              ) : (
                <SkillTriggers reloadList={reloadTriggers} />
              )}
            </div>
          </div>
        </div>
      </div>
      <InstanceInvokeModal
        data={skillDetail}
        visible={invokeModalVisible}
        setVisible={setInvokeModalVisible}
        postConfirmCallback={() => setReloadJobList(true)}
      />
      <NewSkillInstanceModal
        type="update"
        data={skillDetail}
        visible={visible}
        setVisible={(val) => setVisible(val)}
        postConfirmCallback={() => handleGetSkillInstances()}
      />
    </div>
  );
};

export default SkillDetail;
