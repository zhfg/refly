import { createContext, useContext } from 'react';

export interface IProjectContext {
  projectId?: string;
}

const ProjectContext = createContext<IProjectContext | undefined>({ projectId: undefined });

const ProjectProvider = ({ context, children }: { context: IProjectContext; children: React.ReactNode }) => {
  return <ProjectContext.Provider value={context}>{children}</ProjectContext.Provider>;
};

const useProjectContext = () => {
  return useContext(ProjectContext);
};

export { ProjectProvider, useProjectContext };
