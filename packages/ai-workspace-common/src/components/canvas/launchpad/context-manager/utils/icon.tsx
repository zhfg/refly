import { IconLink } from '@arco-design/web-react/icon';
import { IconCanvas, IconDocument, IconResource } from '@refly-packages/ai-workspace-common/components/common/icon';
import { MarkType } from '@refly/common-types';
import { CanvasNodeType } from '@refly/openapi-schema';

export const getTypeIcon = (markType: MarkType, style?: any) => {
  switch (markType) {
    case 'resource':
      return <IconResource style={style} />;
    case 'resourceSelection':
      return <IconResource style={style} />;
    case 'canvas':
      return <IconCanvas style={style} />;
    case 'documentSelection':
      return <IconCanvas style={style} />;
    case 'extensionWeblink':
      return <IconLink style={style} />;
    case 'extensionWeblinkSelection':
      return <IconLink style={style} />;
  }
};

export const getNodeIcon = (node: CanvasNodeType, style?: any) => {
  switch (node) {
    case 'resource':
      return <IconResource style={style} />;
    case 'document':
      return <IconDocument style={style} />;
    case 'resource':
      return <IconResource style={style} />;
    case 'skillResponse':
      return <IconCanvas />;
    default:
      return null;
  }
};
