/**
 * Skill 定义：
 *
 * 1. 定义激活操作 onStart
 * 2. 渠道、推荐触发的网站
 * 3. Skill Collection / Skill Route
 * 4. 组件，打开 popup、popover、modal、或者直接发消息、或者调用某个函数
 *
 */

import { useDispatchAction } from '@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action';
import { skillSpec } from './index';
import { SkillState } from './types';

export const saveToKnowledgeBase = () => {
  const { dispatch } = useDispatchAction();
  const onStart = () => {
    dispatch<SkillState>({
      type: 'state',
      name: skillSpec.name,
      body: {
        modalVisible: true,
      },
    });
  };

  const exit = () => {
    // 将状态置空，并退出
    dispatch<SkillState>({
      type: 'state',
      name: skillSpec.name,
      body: null,
    });
  };

  return {
    onStart,
    exit,
  };
};
