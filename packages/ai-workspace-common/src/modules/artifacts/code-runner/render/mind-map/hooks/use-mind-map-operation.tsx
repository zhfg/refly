import { useCallback } from 'react';
import { NodeData } from '../types';

export const useMindMapOperation = ({
  mindMapData,
  setMindMapData,
  setExpandedNodes,
  setLastAddedNodeId,
}: {
  mindMapData: NodeData;
  setMindMapData: (data: NodeData) => void;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  lastAddedNodeId: string;
  setLastAddedNodeId: (id: string) => void;
}) => {
  const handleToggleExpand = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    },
    [setExpandedNodes],
  );

  const handleLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      const updateNodeLabel = (node: NodeData): NodeData => {
        if (node.id === nodeId) {
          return { ...node, label: newLabel };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNodeLabel),
          };
        }
        return node;
      };

      setMindMapData(updateNodeLabel(mindMapData));
    },
    [mindMapData, setMindMapData],
  );

  const handleAddChild = useCallback(
    (nodeId: string) => {
      const newId = `node-${Date.now()}`;

      const addChildToNode = (node: NodeData): NodeData => {
        if (node.id === nodeId) {
          const children = node.children || [];
          return {
            ...node,
            children: [...children, { id: newId, label: 'New Node', children: [] }],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addChildToNode),
          };
        }
        return node;
      };

      const newData = addChildToNode(mindMapData);
      setMindMapData(newData);

      // Ensure the parent node is expanded
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        next.add(nodeId);
        next.add(newId); // Also add the new node to expanded nodes
        return next;
      });

      // Set the node to focus on after rerender
      setLastAddedNodeId(newId);
    },
    [mindMapData, setMindMapData, setExpandedNodes, setLastAddedNodeId],
  );

  const handleAddSibling = useCallback(
    (nodeId: string) => {
      const newId = `node-${Date.now()}`;

      const findParentAndAddSibling = (node: NodeData): NodeData => {
        if (node.children?.some((child) => child.id === nodeId)) {
          return {
            ...node,
            children: [...node.children, { id: newId, label: 'New Node', children: [] }],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map((child) => findParentAndAddSibling(child)),
          };
        }
        return node;
      };

      // If it's a root node, we just add it at the same level as the root
      if (nodeId === mindMapData.id) {
        const newRoot = {
          id: 'root',
          label: 'Root',
          children: [mindMapData, { id: newId, label: 'New Node', children: [] }],
        };
        setMindMapData(newRoot);
        // Add the new root and new node to expanded nodes
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          next.add('root');
          next.add(newId);
          return next;
        });
      } else {
        const newData = findParentAndAddSibling(mindMapData);
        setMindMapData(newData);
        // Add the new node to expanded nodes
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          next.add(newId);
          return next;
        });
      }

      // Set the node to focus on after rerender
      setLastAddedNodeId(newId);
    },
    [mindMapData, setMindMapData, setExpandedNodes, setLastAddedNodeId],
  );

  return {
    handleToggleExpand,
    handleLabelChange,
    handleAddChild,
    handleAddSibling,
  };
};
