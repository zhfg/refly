import { Tool } from '@langchain/core/tools';

export class Refly extends Tool {
  name = 'refly-tools';

  description = 'Refly is a knowledge management platform. Useful for searching and adding resources.';

  static lc_name() {
    return 'ReflyKnowledgeBase';
  }

  async _call(input: string): Promise<string> {
    return '';
  }
}
