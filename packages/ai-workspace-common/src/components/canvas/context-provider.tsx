import { createContext, useContext } from 'react';

export interface ICanvasContext {
  canvasId?: string;
}

const CanvasContext = createContext<ICanvasContext | undefined>({ canvasId: undefined });

const CanvasProvider = ({ context, children }: { context: ICanvasContext; children: React.ReactNode }) => {
  return <CanvasContext.Provider value={context}>{children}</CanvasContext.Provider>;
};

const useCanvasContext = () => {
  return useContext(CanvasContext);
};

export { CanvasProvider, useCanvasContext };
