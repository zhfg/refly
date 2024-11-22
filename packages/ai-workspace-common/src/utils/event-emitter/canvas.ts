import { CanvasNodeType } from '@refly/openapi-schema';
import mitt from 'mitt';
import { CanvasNodeData } from '@refly-packages/ai-workspace-common/components/canvas/node';

export type Events = {
  addNode: {
    type: CanvasNodeType;
    data: CanvasNodeData;
  };
};

export type CanvasOperation = 'addNode';

export const canvasEmitter = mitt<Events>();
