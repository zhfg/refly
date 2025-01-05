import { createContext, useContext, useState } from 'react';

interface EditorPerformanceContextType {
  isNodeDragging: boolean;
  setIsNodeDragging: (dragging: boolean) => void;
}

const EditorPerformanceContext = createContext<EditorPerformanceContextType>({
  isNodeDragging: false,
  setIsNodeDragging: () => {},
});

export const EditorPerformanceProvider = ({ children }) => {
  const [isNodeDragging, setIsNodeDragging] = useState(false);

  return (
    <EditorPerformanceContext.Provider value={{ isNodeDragging, setIsNodeDragging }}>
      {children}
    </EditorPerformanceContext.Provider>
  );
};

export const useEditorPerformance = () => useContext(EditorPerformanceContext);
