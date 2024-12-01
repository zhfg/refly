import { IconFolder } from '@arco-design/web-react/icon';
import {
  HiOutlineDocument,
  HiOutlineNewspaper,
  HiOutlineSparkles,
  HiSparkles,
  HiOutlineChatBubbleLeftRight,
  HiMiniPlayCircle,
} from 'react-icons/hi2';
import { LuMoreVertical, LuMoreHorizontal } from 'react-icons/lu';

import { RiDoubleQuotesL, RiDeleteBinLine } from 'react-icons/ri';
import { BiText } from 'react-icons/bi';
import { HiPlus } from 'react-icons/hi';
import { PiNotePencil } from 'react-icons/pi';
import { Artifact } from '@refly/openapi-schema';
import { cn } from '@refly-packages/utils/cn';

export const IconProject = IconFolder;
export const IconCanvasFill = HiSparkles;
export const IconCanvas = HiOutlineSparkles;
export const IconDocument = HiOutlineDocument;
export const IconResource = HiOutlineNewspaper;
export const IconResponse = HiOutlineChatBubbleLeftRight;
export const IconThread = HiOutlineChatBubbleLeftRight;
export const IconQuote = RiDoubleQuotesL;
export const IconText = BiText;
export const IconPlus = HiPlus;
export const IconPlay = HiMiniPlayCircle;
export const IconMoreVertical = LuMoreVertical;
export const IconMoreHorizontal = LuMoreHorizontal;
export const IconNotePencil = PiNotePencil;
export const IconDelete = RiDeleteBinLine;

export const getArtifactIcon = (artifact: Artifact, className?: string) => {
  switch (artifact.type) {
    case 'document':
      return <IconDocument className={cn('w-4 h-4', className)} />;
    default:
      return <HiOutlineSparkles className={cn('w-4 h-4', className)} />;
  }
};
