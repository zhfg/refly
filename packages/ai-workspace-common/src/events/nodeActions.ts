import mitt from 'mitt';

export type NodeActionEvents = {
  [key: `node:${string}:rerun`]: void;
  [key: `node:${string}:delete`]: void;
  [key: `node:${string}:addToContext`]: void;
  [key: `node:${string}:createDocument`]: void;
  [key: `node:${string}:ungroup`]: void;
  [key: `node:${string}:insertToDoc`]: {
    content?: string;
  };
  [key: `node:${string}:askAI`]: void;
  [key: `node:${string}:compareAskAI`]: void;
};

export const nodeActionEmitter = mitt<NodeActionEvents>();

export const createNodeEventName = (nodeId: string, action: string) =>
  `node:${nodeId}:${action}` as keyof NodeActionEvents;

export const cleanupNodeEvents = (nodeId: string) => {
  const eventTypes = [
    'run',
    'rerun',
    'delete',
    'addToContext',
    'createDocument',
    'insertToDoc',
    'ungroup',
    'askAI',
    'compareAskAI',
  ];
  eventTypes.forEach((type) => {
    nodeActionEmitter.all.delete(createNodeEventName(nodeId, type));
  });
};
