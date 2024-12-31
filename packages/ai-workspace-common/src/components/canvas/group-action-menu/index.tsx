import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { FC, useCallback } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Group, Ungroup } from 'lucide-react';
import { useNodeSelection } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-selection';

interface GroupActionMenuProps {
  nodeId: string;
  isTemporary?: boolean;
  onClose?: () => void;
}

export const GroupActionMenu: FC<GroupActionMenuProps> = ({ nodeId, isTemporary, onClose }) => {
  const { t } = useTranslation();
  const { createGroupFromSelectedNodes, ungroupNodes } = useNodeSelection();

  const handleAlign = useCallback(
    (direction: 'left' | 'center' | 'right') => {
      // Implement alignment logic here
      onClose?.();
    },
    [onClose],
  );

  const handleGroup = useCallback(() => {
    createGroupFromSelectedNodes();
    onClose?.();
  }, [nodeId, createGroupFromSelectedNodes, onClose]);

  const handleUngroup = useCallback(() => {
    ungroupNodes(nodeId);
    onClose?.();
  }, [nodeId, ungroupNodes, onClose]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-1 flex gap-1 border border-[rgba(0,0,0,0.06)]">
      <Button
        type="text"
        className="flex items-center justify-center w-8 h-8 hover:bg-gray-50"
        icon={<AlignLeft className="w-4 h-4" />}
        onClick={() => handleAlign('left')}
      />
      <Button
        type="text"
        className="flex items-center justify-center w-8 h-8 hover:bg-gray-50"
        icon={<AlignCenter className="w-4 h-4" />}
        onClick={() => handleAlign('center')}
      />
      <Button
        type="text"
        className="flex items-center justify-center w-8 h-8 hover:bg-gray-50"
        icon={<AlignRight className="w-4 h-4" />}
        onClick={() => handleAlign('right')}
      />
      {isTemporary ? (
        <Button
          type="text"
          className="flex items-center justify-center w-8 h-8 hover:bg-gray-50"
          icon={<Group className="w-4 h-4" />}
          onClick={handleGroup}
        />
      ) : (
        <Button
          type="text"
          className="flex items-center justify-center w-8 h-8 hover:bg-gray-50"
          icon={<Ungroup className="w-4 h-4" />}
          onClick={handleUngroup}
        />
      )}
    </div>
  );
};
