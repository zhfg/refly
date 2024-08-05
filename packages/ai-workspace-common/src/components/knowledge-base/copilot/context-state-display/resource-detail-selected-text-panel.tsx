import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { BaseSelectedTextPanel } from './base-selected-text-panel';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button } from '@arco-design/web-react';

export const ResourceDetailSelectedTextPanel = () => {
  const { runSkill } = useBuildThreadAndRun();

  const skillList = [
    {
      title: '解释说明',
      onClick: () => {
        runSkill(getQuickActionPrompt('explain')?.prompt);
      },
    },
    {
      title: '翻译',
      onClick: () => {
        runSkill(getQuickActionPrompt('explain')?.prompt);
      },
    },
  ];

  const skillContent = (
    <div className="context-state-action-list">
      {skillList.map((item, index) => (
        <Button
          type="primary"
          size="mini"
          className="context-state-action-item"
          style={{ borderRadius: 8 }}
          onClick={() => {
            item?.onClick();
          }}
        >
          {item?.title}
        </Button>
      ))}
    </div>
  );

  return <BaseSelectedTextPanel title="选中资源内容问答" skillContent={skillContent} />;
};
