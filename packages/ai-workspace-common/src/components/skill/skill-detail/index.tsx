import { useState, useEffect } from 'react';

// components
import { useTranslation } from 'react-i18next';
import { SkillJobs } from '@refly-packages/ai-workspace-common/components/skill/skill-jobs';
import { SkillTriggers } from '@refly-packages/ai-workspace-common/components/skill/skill-triggers';
import { InstanceInvokeModal } from '@refly-packages/ai-workspace-common/components/skill/instance-invoke-modal';
import { InstanceDropdownMenu } from '@refly-packages/ai-workspace-common/components/skill/instance-dropdown-menu';
import { NewSkillInstanceModal } from '@refly-packages/ai-workspace-common/components/skill/new-instance-modal';
import { NewTriggersModal } from '@refly-packages/ai-workspace-common/components/skill/new-triggers-modal';
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';

// store
import { useImportNewTriggerModal } from '@refly-packages/ai-workspace-common/stores/import-new-trigger-modal';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

import './index.scss';
import { SkillInstance } from '@refly/openapi-schema';

import { Radio, Avatar, Button, Typography, Spin } from '@arco-design/web-react';
import { HiOutlinePlus, HiMiniArrowUturnLeft } from 'react-icons/hi2';

const RadioGroup = Radio.Group;

const ContentTab = (props: { val: string; setVal: (val: string) => void }) => {
  const { setVal, val } = props;
  const { t } = useTranslation();
  const importNewTriggerModal = useImportNewTriggerModal();

  const addTrigger = () => {
    importNewTriggerModal.setShowtriggerModall(true);
  };

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

      {val === 'triggers' && (
        <Button type="primary" className="add-trigger-btn" onClick={addTrigger}>
          <HiOutlinePlus />
          {t('skill.skillDetail.addTrigger')}
        </Button>
      )}
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
  const [loading, setLoading] = useState(true);

  const [reloadJobList, setReloadJobList] = useState(false);
  const handleGetSkillInstances = async () => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  };

  const [invokeModalVisible, setInvokeModalVisible] = useState(false);
  const handleSkillInvoke = () => {
    setInvokeModalVisible(true);
  };

  const getPopupContainer = () => {
    return document.getElementById('skill-detail-action') as HTMLElement;
  };

  useEffect(() => {
    handleGetSkillInstances();
  }, []);

  return (
    <div className="skill-detail" id="skill-detail">
      <div className="skill-detail__header">
        <div className="skill-detail__back" onClick={() => window.history.back()}>
          <HiMiniArrowUturnLeft className="skill-detail__back-icon" />
          {t('skill.skillDetail.back')}
        </div>
      </div>

      {loading ? (
        <Spin
          dot
          loading={loading}
          style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}
          className="skill-detail__content"
        >
          <div className="skill-detail__content-wrap"></div>
        </Spin>
      ) : (
        <div className="skill-detail__content">
          <div className="skill-detail__content-wrap">
            <div className="skill-detail__content-top">
              <SkillAvatar icon={skillDetail?.icon} size={140} displayName={skillDetail?.displayName} />

              <div className="skill-detail__content-top-info">
                <div className="skill-name">{skillDetail?.displayName}</div>
                <Typography.Paragraph className="skill-desc" ellipsis={{ rows: 3 }} style={{ lineHeight: 1.51 }}>
                  {skillDetail?.description}
                </Typography.Paragraph>
                <div className="skill-action" id="skill-detail-action">
                  {/* 暂时隐藏 */}
                  {/* <Button
                    className="skill-action__invoke"
                    type="primary"
                    style={{ borderRadius: 4 }}
                    onClick={handleSkillInvoke}
                  >
                    <HiOutlinePlay />
                    {t('skill.skillDetail.run')}
                  </Button> */}
                  <InstanceDropdownMenu
                    data={skillDetail}
                    setUpdateModal={(visible) => setVisible(visible)}
                    getPopupContainer={getPopupContainer}
                  />
                </div>
              </div>
            </div>

            <div className="skill-detail__content-bottom">
              {/* 暂时隐藏 */}
              {/* <ContentTab setVal={setVal} val={val} /> */}
              <div className="skill-detail__content-list">
                {val === 'jobs' ? (
                  <SkillJobs reloadList={reloadJobList} setReloadList={setReloadJobList} />
                ) : (
                  <SkillTriggers />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <InstanceInvokeModal
        data={skillDetail}
        visible={invokeModalVisible}
        setVisible={setInvokeModalVisible}
        postConfirmCallback={() => setReloadJobList(true)}
      />
      <NewSkillInstanceModal
        type="update"
        instance={skillDetail}
        visible={visible}
        setVisible={(val) => setVisible(val)}
        postConfirmCallback={() => handleGetSkillInstances()}
      />
      <NewTriggersModal data={skillDetail} />
    </div>
  );
};

export default SkillDetail;
