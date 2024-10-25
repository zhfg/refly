import { createContext, useContext } from 'react';

export interface IResourceContext {
  resourceId?: string;
}

const ResourceContext = createContext<IResourceContext | undefined>({ resourceId: undefined });

const ResourceProvider = ({ context, children }: { context: IResourceContext; children: React.ReactNode }) => {
  return <ResourceContext.Provider value={context}>{children}</ResourceContext.Provider>;
};

const useResourceContext = () => {
  return useContext(ResourceContext);
};

export { ResourceProvider, useResourceContext };
