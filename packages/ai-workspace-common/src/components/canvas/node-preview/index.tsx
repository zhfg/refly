import { Button } from 'antd';
import { CanvasNodeType } from '@refly/openapi-schema';
import { CanvasNode } from '../nodes/types';
import { ResponseNodePreview } from './response';
import { ResourceNodePreview } from './resource';
import { SkillNodePreview } from './skill';
import { ToolNodePreview } from './tool';
import { DocumentNodePreview } from './document';

export const NodePreview = (props: { node: CanvasNode; handleClosePanel: () => void }) => {
  const { node, handleClosePanel } = props;

  const previewComponent = (nodeType: CanvasNodeType) => {
    switch (nodeType) {
      case 'resource':
        return <ResourceNodePreview resourceId={node.data.entityId} />;
      case 'document':
        return <DocumentNodePreview />;
      case 'skill':
        return <SkillNodePreview />;
      case 'tool':
        return <ToolNodePreview />;
      case 'response':
        return <ResponseNodePreview resultId={node.data.entityId} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed top-1/2 right-2 w-[420px] bg-white rounded-lg shadow-lg z-10 transform -translate-y-1/2"
      style={{ height: 'calc(100vh - 40px)', maxHeight: 'calc(100vh - 40px)' }}
    >
      <div className="flex justify-between items-center p-4">
        <h3 className="text-lg font-semibold">Node Preview</h3>
        <Button type="text" onClick={handleClosePanel} className="px-2 text-gray-500 hover:text-gray-700">
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </Button>
      </div>

      <div className="h-[calc(100%-64px)] overflow-auto rounded-b-lg">{previewComponent(node?.type)}</div>
    </div>
  );
};
