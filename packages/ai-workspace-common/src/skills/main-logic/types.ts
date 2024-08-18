import { IRuntime } from '@refly/common-types';

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
