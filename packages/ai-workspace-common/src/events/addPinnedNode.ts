import mitt from 'mitt';

export type Events = {
  addPinnedNode: {
    canvasId: string;
    id: string;
  };
};

export const addPinnedNodeEmitter = mitt<Events>();
