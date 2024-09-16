import { IconFile, IconBook, IconFolder, IconLink } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';

export const getTypeIcon = (mark: Mark, style: any) => {
  switch (mark.type) {
    case 'resource':
      return <IconFile style={style} />;
    case 'resourceSelection':
      return <IconFile style={style} />;
    case 'note':
      return <IconBook style={style} />;
    case 'noteSelection':
      return <IconBook style={style} />;
    case 'collection':
      return <IconFolder style={style} />;
    case 'extensionWeblink':
      return <IconLink style={style} />;
    case 'extensionWeblinkSelection':
      return <IconLink style={style} />;
  }
};
