import { IconLink } from '@arco-design/web-react/icon';
import { IconCanvas, IconProject, IconResource } from '@refly-packages/ai-workspace-common/components/common/icon';
import { MarkType } from '@refly/common-types';

export const getTypeIcon = (markType: MarkType, style?: any) => {
  switch (markType) {
    case 'resource':
      return <IconResource style={style} />;
    case 'resourceSelection':
      return <IconResource style={style} />;
    case 'canvas':
      return <IconCanvas style={style} />;
    case 'canvasSelection':
      return <IconCanvas style={style} />;
    case 'project':
      return <IconProject style={style} />;
    case 'extensionWeblink':
      return <IconLink style={style} />;
    case 'extensionWeblinkSelection':
      return <IconLink style={style} />;
  }
};
