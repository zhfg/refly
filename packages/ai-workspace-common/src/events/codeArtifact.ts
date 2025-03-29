import mitt from 'mitt';

export type Events = {
  contentUpdate: {
    artifactId: string;
    content: string;
  };
  statusUpdate: {
    artifactId: string;
    status: 'finish' | 'generating';
  };
};

export const codeArtifactEmitter = mitt<Events>();
