import { IconSettings } from '@arco-design/web-react/icon';
import { useResizeBox } from '@refly-packages/ai-workspace-common/hooks/use-resize-box';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

export const SkillDisplay = () => {
  const skillStore = useSkillStore();

  const [containCnt] = useResizeBox({
    getGroupSelector: () => {
      const container = getPopupContainer();
      const elem = container.querySelector('.skill-container');

      return elem as HTMLElement;
    },
    getResizeSelector: () => {
      const container = getPopupContainer();
      const elems = container.querySelectorAll('.skill-item') as NodeListOf<HTMLElement>;

      return elems;
    },
    initialContainCnt: 3,
    paddingSize: 0,
    placeholderWidth: 100,
    itemSize: 80,
  });

  return (
    <div className="skill-container">
      {skillStore?.skillInstances?.slice(0, containCnt).map((item, index) => (
        <div
          key={index}
          className="skill-item"
          onClick={() => {
            skillStore.setSelectedSkillInstalce(item);
          }}
        >
          <span className="skill-item-title">{item?.displayName}</span>
        </div>
      ))}
      <div
        key="more"
        className="skill-item"
        onClick={() => {
          skillStore.setSkillManagerModalVisible(true);
        }}
      >
        <IconSettings /> <p className="skill-title skill-item-title">管理</p>
      </div>
    </div>
  );
};
