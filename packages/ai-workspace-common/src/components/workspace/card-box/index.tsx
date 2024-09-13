import { ReactNode } from 'react';
import { Typography } from '@arco-design/web-react';
import { Resource, Note, Collection } from '@refly/openapi-schema';
import './index.scss';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

interface CardBoxBaseProps {
  index: number;
  type: string;
  cardIcon?: ReactNode;
  children?: ReactNode;
  onClick: () => void;
}

interface ResourceCardProps extends CardBoxBaseProps {
  type: 'resource';
  cardData: Resource;
}

interface NoteCardProps extends CardBoxBaseProps {
  type: 'note';
  cardData: Note;
}

interface CollectionCardProps extends CardBoxBaseProps {
  type: 'collection';
  cardData: Collection;
}

const contentKey = {
  resource: 'contentPreview',
  note: 'contentPreview',
  collection: 'description',
};

export const CardBox = (props: ResourceCardProps | NoteCardProps | CollectionCardProps) => {
  const handleClickLink = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const { children, onClick } = props;

  return (
    <div
      className="p-4 m-3 border rounded-lg card-box border-black/8"
      id={`${props.type}-${props.index}`}
      onClick={() => onClick()}
    >
      <div className="h-40 overflow-hidden">
        <div className="flex items-center mb-1 resource-url">
          <div className="flex items-center justify-center border rounded-lg card-icon-box shrink-0 border-black/8">
            {props.cardIcon}
          </div>
          {props.type === 'resource' && props?.cardData?.data?.url ? (
            <a
              className="ml-2 text-xs"
              href="#"
              onClick={(e) => {
                e.stopPropagation();
                handleClickLink(props.cardData.data?.url);
              }}
            >
              {props?.cardData?.data?.url}
            </a>
          ) : (
            <Typography.Text
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 0, marginLeft: 8, fontWeight: 500, fontSize: '16px' }}
            >
              {props.cardData?.title}
            </Typography.Text>
          )}
        </div>
        {props.type === 'resource' && props?.cardData?.data?.url && (
          <Typography.Text ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontWeight: 500, fontSize: '16px' }}>
            {props.cardData?.title}
          </Typography.Text>
        )}
        <div style={{ marginBottom: 0, marginTop: 16, position: 'relative' }}>
          <Markdown content={props.cardData?.[contentKey[props.type]]} fontSize={12} />
        </div>
      </div>

      {children}
    </div>
  );
};
