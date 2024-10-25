import { ResourceView } from '@refly-packages/ai-workspace-common/components/project-detail/resource-view';
import { useTranslation } from 'react-i18next';

import './index.scss';

export const ContentArea = (props: { resourceId: string }) => {
  const { resourceId } = props;
  const { t } = useTranslation();

  return (
    <div className="h-full pt-[10px]">
      <ResourceView resourceId={resourceId} />
    </div>
  );
};
