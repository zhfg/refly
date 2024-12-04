import { SourceList } from '@refly-packages/ai-workspace-common/components/source-list';
import { Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

export const SourceViewer = (props: { sources: Source[]; query: string }) => {
  const { sources, query } = props;

  const { t } = useTranslation();

  return (
    <div className="session-source">
      {(sources || [])?.length > 0 ? (
        <div className="session-title-icon mb-[8px]">
          <p>{t('threadDetail.item.session.source')}</p>
        </div>
      ) : null}
      <SourceList sources={sources || []} query={query} />
    </div>
  );
};
