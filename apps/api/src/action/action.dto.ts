import {
  InvokeActionRequest,
  ActionResult,
  ActionStep,
  ActionType,
} from '@refly-packages/openapi-schema';
import { ActionResult as ActionResultModel, ActionStep as ActionStepModel } from '@prisma/client';
import { pick } from '@/utils';

export interface InvokeActionJobData extends InvokeActionRequest {
  uid: string;
  rawParam: string;
}

export function actionStepPO2DTO(step: ActionStepModel): ActionStep {
  return {
    ...pick(step, ['title', 'content']),
    artifacts: JSON.parse(step.artifacts || '[]'),
    structuredData: JSON.parse(step.structuredData || '{}'),
  };
}

export function actionResultPO2DTO(
  result: ActionResultModel & { steps?: ActionStepModel[] },
): ActionResult {
  return {
    ...pick(result, ['resultId', 'title', 'canvasId', 'status']),
    type: result.type as ActionType,
    actionMeta: JSON.parse(result.actionMeta || '{}'),
    logs: JSON.parse(result.logs || '[]'),
    errors: JSON.parse(result.errors || '[]'),
    tokenUsage: JSON.parse(result.tokenUsage || '[]'),
    invokeParam: JSON.parse(result.invokeParam || '{}'),
    createdAt: result.createdAt.toJSON(),
    updatedAt: result.updatedAt.toJSON(),
    steps: result.steps?.map(actionStepPO2DTO),
  };
}
