import { Tool } from '@langchain/core/tools';
import { BaseToolParams } from '@/base';
import { SkillEngine } from '@/engine';

export interface ReflySearchParameters extends BaseToolParams {}

export class ReflySearch extends Tool {
  private engine: SkillEngine;

  name = 'refly_search';

  description = 'Refly search can be used to search everything within Refly.';

  constructor(params: ReflySearchParameters) {
    super(params);

    this.engine = params.engine;
  }

  static lc_name() {
    return 'ReflySearch';
  }

  async _call(input: string): Promise<string> {
    // TODO: implement this
    return '';
  }
}
