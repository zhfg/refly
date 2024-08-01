import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchResult } from '@refly/openapi-schema';

export const NotePopover = () => {
  const fetchData = async (queryPayload) => {
    const res = await getClient().listNotes({
      query: {
        ...queryPayload,
      },
    });

    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.noteId,
      title: item?.title,
      domain: 'note',
    }));
    return { success: res?.data?.success, data };
  };

  return (
    <BasePopover
      content={<Content domain="note" title="导入笔记" searchPlaceholder="搜索笔记" fetchData={fetchData} />}
    >
      <div className="context-tree-node-extra">
        <Button type="text" className="context-tree-node-extra-btn">
          <span>添加</span>
        </Button>
      </div>
    </BasePopover>
  );
};
