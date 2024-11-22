import { useEffect } from 'react';
import { useActionResultStoreShallow } from '@refly-packages/ai-workspace-common/stores/action-result';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { Space } from 'antd';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

export const ResponseNodePreview = ({ resultId }: { resultId: string }) => {
  const { result, updateActionResult } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[resultId],
    updateActionResult: state.updateActionResult,
  }));
  const { input, context, tplConfig } = result?.invokeParam || {};

  const fetchActionResult = async (resultId: string) => {
    const { data, error } = await getClient().getActionResult({
      query: { resultId },
    });

    if (error || !data.success) {
      return;
    }

    updateActionResult(resultId, data.data);
  };

  useEffect(() => {
    if (!result) {
      fetchActionResult(resultId);
    }
  }, [resultId]);

  return (
    <div className="h-full bg-gray-50 rounded p-3">
      <Space direction="vertical" size={10} className="w-full">
        <h1>{input?.query}</h1>
        <pre className="text-black text-sm h-20 overflow-y-auto">Context: {JSON.stringify(context, null, 2)}</pre>
        <pre className="text-black text-sm h-20 overflow-y-auto">Config: {JSON.stringify(tplConfig, null, 2)}</pre>
        <Markdown content={result?.content} />
        {result?.tokenUsage?.length > 0 && <div>Token Usage: {JSON.stringify(result?.tokenUsage)}</div>}
      </Space>
    </div>
  );
};
