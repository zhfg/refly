import { InvokeActionRequest, ActionResult, ActionType } from '@refly-packages/openapi-schema';
import { ActionResult as ActionResultModel } from '@prisma/client';
import { pick } from '@/utils';

export interface InvokeActionJobData extends InvokeActionRequest {
  uid: string;
  rawParam: string;
}

export function actionResultPO2DTO(result: ActionResultModel): ActionResult {
  return {
    ...pick(result, ['resultId', 'title', 'canvasId', 'status', 'content']),
    type: result.type as ActionType,
    actionMeta: JSON.parse(result.actionMeta || '{}'),
    logs: JSON.parse(result.logs || '[]'),
    structuredData: JSON.parse(result.structuredData || '{}'),
    errors: JSON.parse(result.errors || '[]'),
    tokenUsage: JSON.parse(result.tokenUsage || '[]'),
    invokeParam: JSON.parse(result.invokeParam || '{}'),
    artifacts: JSON.parse(result.artifacts || '[]'),
    createdAt: result.createdAt.toJSON(),
    updatedAt: result.updatedAt.toJSON(),
  };
}
