import React, { Suspense } from 'react';
import { SkillSpec } from '@refly-packages/ai-workspace-common/skills/main-logic/types';

const SaveKnowledgeBaseModal = React.lazy(() => import('./component'));

export const skillSpec: SkillSpec = {
  name: 'saveToKnowledgeBase',
  appScope: ['resource.context'],
  runtimeScope: ['extension-csui', 'extension-sidepanel'],
  component: {
    Component: (props) => (
      <Suspense>
        <SaveKnowledgeBaseModal {...props} />
      </Suspense>
    ),
    position: 'modal',
  },
  hook: async () => {
    const { saveToKnowledgeBase } = await import('./hook');

    return saveToKnowledgeBase;
  },
};
