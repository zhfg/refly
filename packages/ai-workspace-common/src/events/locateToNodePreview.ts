import mitt from 'mitt';

export type Events = {
  locateToNodePreview: {
    canvasId: string;
    id: string;
  };
};

export const locateToNodePreviewEmitter = mitt<Events>();
