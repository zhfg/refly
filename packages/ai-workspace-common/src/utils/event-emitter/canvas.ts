import { CanvasNodeType } from '@refly/openapi-schema';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import mitt from 'mitt';

export type Events = {
  addNode: {
    type: CanvasNodeType;
    data: ContextItem[];
  };
};

export type CanvasOperation = 'addNode';

export const canvasEmitter = mitt<Events>();
