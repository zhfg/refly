import { IRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export type AppScope = 'resource.context' | 'knowledgebase.context' | 'skill';
export type AppPosition = 'modal' | 'popover' | 'popconfirm';

export interface SkillSpec {
  name: string;
  appScope: AppScope[];
  runtimeScope: IRuntime[];
  component: {
    Component: any;
    position: AppPosition;
  };
  hook: any;
}
