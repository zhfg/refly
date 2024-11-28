import { SkillEvent } from '@refly-packages/common-types';
import { Prisma } from '@prisma/client';
import { ActionStepMeta, Artifact } from '@refly-packages/openapi-schema';
import { SkillRunnableMeta } from '@refly-packages/skill-template';

interface StepData {
  name: string;
  title: string;
  content: string;
  structuredData: Record<string, unknown>;
  artifacts: Record<string, Artifact>;
}

export class ResultAggregator {
  /**
   * Step title list, in the order of sending
   */
  private stepNames: string[] = [];

  /**
   * Message data, with key being the step name and value being the message
   */
  private data: Record<string, StepData> = {};

  /**
   * Whether the skill invocation is aborted
   */
  private aborted: boolean = false;

  private getOrInitData(step: ActionStepMeta): StepData {
    if (!step) {
      step = {
        name: 'default',
        title: 'Default Step',
      };
    }

    const stepData = this.data[step.name];
    if (stepData) {
      return stepData;
    }

    this.stepNames.push(step.name);

    return {
      ...step,
      content: '',
      structuredData: {},
      artifacts: {},
    };
  }

  abort() {
    this.aborted = true;
  }

  addSkillEvent(event: SkillEvent) {
    if (this.aborted) {
      return;
    }

    const step: StepData = this.getOrInitData(event.step);
    switch (event.event) {
      case 'artifact':
        if (event.artifact) {
          step.artifacts[event.artifact.entityId] = event.artifact;
        }
        break;
      case 'structured_data':
        if (event.structuredDataKey) {
          step.structuredData[event.structuredDataKey] = event.content;
        }
        break;
    }
    this.data[event.step.name] = step;
  }

  handleStreamContent(meta: SkillRunnableMeta, content: string) {
    if (this.aborted) {
      return;
    }

    const step = this.getOrInitData(meta.step);

    step.content += content;

    this.data[meta.step.name] = step;
  }

  getSteps({ resultId }: { resultId: string }): Prisma.ActionStepCreateManyInput[] {
    return this.stepNames.map((stepName, order) => {
      const { name, title, content, structuredData, artifacts } = this.data[stepName];

      return {
        name,
        title,
        content,
        resultId,
        order,
        structuredData: JSON.stringify(structuredData),
        artifacts: JSON.stringify(Object.values(artifacts)),
      };
    });
  }
}
