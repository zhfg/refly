import { ReactNode } from 'react';
import { Typography } from '@arco-design/web-react';
import { Canvas } from '@refly/openapi-schema';
import './index.scss';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { IconCanvas } from '@refly-packages/ai-workspace-common/components/common/icon';

interface CanvasCardProps {
  cardData: Canvas;
  index: number;
  children?: ReactNode;
  onClick: () => void;
}

export const CanvasCard = (props: CanvasCardProps) => {
  const { children, onClick, cardData } = props;

  return (
    <div
      className="p-4 m-3 rounded-lg border card-box border-black/8"
      id={`canvas-${props.index}`}
      onClick={() => onClick()}
    >
      <div className="overflow-hidden h-40">
        <div className="flex items-center mb-1">
          <div className="flex justify-center items-center rounded-lg border card-icon-box shrink-0 border-black/8">
            <IconCanvas size={18} />
          </div>
          <Typography.Text
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 0, marginLeft: 8, fontWeight: 500, fontSize: '16px' }}
          >
            {props.cardData?.title}
          </Typography.Text>
        </div>

        <div style={{ marginBottom: 0, marginTop: 16, position: 'relative' }}>
          <Markdown content={cardData?.contentPreview} fontSize={12} />
        </div>
      </div>

      {children}
    </div>
  );
};
