import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { BaseSelectedTextCard } from './base-selected-text-card';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button } from '@arco-design/web-react';
import { useGetCurrentSelectedText } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';

export const ResourceSelectedTextCard = () => {
  const { runSkill } = useBuildThreadAndRun();
  const { hasContent } = useGetCurrentSelectedText();
  const disabled = !hasContent;

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
          type="outline"
          size="mini"
          className="context-state-action-item"
          style={{ borderRadius: 8 }}
          disabled={disabled}
          onClick={() => {
            item?.onClick();
          }}
        >
          {item?.title}
        </Button>
      ))}
    </div>
  );

  return <BaseSelectedTextCard title="选中资源内容问答" skillContent={skillContent} />;
};
