import { Tool } from '@langchain/core/tools';
import { SearchDomain, SearchMode, User } from '@refly/openapi-schema';
import { BaseToolParams } from '../../base';
import { SkillEngine } from '../../engine';

export interface ReflySearchParameters extends BaseToolParams {
  user: User;
  domains: SearchDomain[];
  mode: SearchMode;
}

export class ReflySearch extends Tool {
  private engine: SkillEngine;
  private user: User;
  private domains: SearchDomain[];
  private mode: SearchMode;

  name = 'refly_search';

  description = 'Refly search can be used to search everything within Refly.';

  constructor(params: ReflySearchParameters) {
    super(params);

    this.engine = params.engine;
    this.user = params.user;
    this.domains = params.domains;
    this.mode = params.mode;
  }

  static lc_name() {
    return 'ReflySearch';
  }

  async _call(input: string): Promise<string> {
    // TODO: implement given resourceIds and collectionIds q&a @mrcfps
    const res = await this.engine.service.search(this.user, {
      query: input,
      domains: this.domains,
      mode: this.mode,
    });
    return JSON.stringify(res);
  }
}
