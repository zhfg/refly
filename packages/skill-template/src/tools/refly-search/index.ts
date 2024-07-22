import { Tool } from '@langchain/core/tools';
import { BaseToolParams } from '../../base';
import { SkillEngine, SkillUser } from '../../engine';

export interface ReflySearchParameters extends BaseToolParams {
  user: SkillUser;
}

export class ReflySearch extends Tool {
  private engine: SkillEngine;
  private user: SkillUser;

  name = 'refly_search';

  description = 'Refly search can be used to search everything within Refly.';

  constructor(params: ReflySearchParameters) {
    super(params);

    this.engine = params.engine;
    this.user = params.user;
  }

  static lc_name() {
    return 'ReflySearch';
  }

  async _call(input: string): Promise<string> {
    const res = await this.engine.service.search(this.user, {
      query: input,
      domains: ['resource'],
      mode: 'vector',
    });
    return JSON.stringify(res);
  }
}
