import { Resource, CanvasNodeType } from '@refly-packages/openapi-schema';

import mitt from 'mitt';
export type Events = {
  addNode: {
    type: CanvasNodeType;
    data: Resource[];
  };
};

export type CanvasOperation = 'addNode';

export const canvasEmitter = mitt<Events>();
