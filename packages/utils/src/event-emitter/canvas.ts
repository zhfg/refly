import { Resource } from '@refly-packages/openapi-schema';
import { CanvasNodeType } from '@refly-packages/ai-workspace-common/components/canvas/node';
import mitt from 'mitt';
export type Events = {
  addNode: {
    type: CanvasNodeType;
    data: Resource[];
  };
};

export type CanvasOperation = 'addNode';

export const canvasEmitter = mitt<Events>();
