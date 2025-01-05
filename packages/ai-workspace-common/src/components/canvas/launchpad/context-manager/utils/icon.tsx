import {
  IconMemo,
  IconThreadHistory,
  IconResponseFilled,
  IconResourceFilled,
  IconDocumentFilled,
  IconThreadHistoryFilled,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { NODE_COLORS } from '@refly-packages/ai-workspace-common/components/canvas/nodes/shared/colors';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const getContextItemIcon = (item: IContextItem, style?: React.CSSProperties) => {
  const color = NODE_COLORS[item.type];

  switch (item.type) {
    case 'resource':
      return <IconResourceFilled style={{ color, ...style }} />;
    case 'document':
      return <IconDocumentFilled style={{ color, ...style }} />;
    case 'memo':
      return <IconMemo style={{ color, ...style }} />;
    case 'skillResponse':
      return item.metadata?.withHistory ? (
        <IconThreadHistoryFilled style={{ color: NODE_COLORS['threadHistory'], ...style }} />
      ) : (
        <IconResponseFilled style={{ color, ...style }} />
      );
    default:
      return null;
  }
};
