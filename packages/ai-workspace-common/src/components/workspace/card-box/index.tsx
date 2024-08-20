import { ReactNode } from 'react';
import { Typography } from '@arco-design/web-react';
import { Resource, Note, Collection } from '@refly/openapi-schema';
import './index.scss';

interface CardBoxBaseProps {
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
  note: 'content',
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
    <div className="p-4 m-3 border rounded-lg card-box border-black/8" onClick={() => onClick()}>
      <div className="h-40 overflow-hidden">
        <div className="flex mt-3 mb-1 resource-url">
          <div className="flex items-center justify-center border rounded-lg card-icon-box shrink-0 border-black/8">
            {props.cardIcon}
          </div>
          {props.type === 'resource' ? (
            <a
              className="ml-2 text-xs"
              href="#"
              onClick={(e) => {
                e.stopPropagation();
                handleClickLink(props.cardData.data?.url);
              }}
            >
              {props?.cardData.data?.url}
            </a>
          ) : (
            <Typography.Text ellipsis={{ rows: 2 }} style={{ marginBottom: 0, marginLeft: 8, fontWeight: 500 }}>
              {props.cardData?.title}
            </Typography.Text>
          )}
        </div>
        {props.type === 'resource' && (
          <Typography.Text ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontWeight: 500 }}>
            {props.cardData?.title}
          </Typography.Text>
        )}
        <Typography.Text ellipsis={{ rows: 4 }} style={{ marginBottom: 0 }}>
          {props.cardData?.[contentKey[props.type]]}
        </Typography.Text>
      </div>

      {children}
    </div>
  );
};
