import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { WeblinkService } from '../weblink/weblink.service';
import { WeblinkModule } from '../weblink/weblink.module';
import { CommonModule } from '../common/common.module';

describe('LlmService', () => {
  let module: TestingModule;
  let service: LlmService;
  let weblinkService: WeblinkService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, CommonModule, WeblinkModule],
      providers: [LlmService],
    }).compile();

    service = module.get<LlmService>(LlmService);
    weblinkService = module.get<WeblinkService>(WeblinkService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('extractContentMeta', async () => {
    const url = 'https://paulgraham.com/vcsqueeze.html';
    const doc = await weblinkService.parseWebLinkContent(url);
    const res = await service.extractContentMeta(doc);
    expect(res).toEqual({});
  });

  it('summarizeMultipleWeblink', async () => {
    const docs = [
      {
        title: `Google SGE And Generative AI In Search: What To Expect In 2024`,
        abstract: `- Google's Search Generative Experience (SGE) continues to evolve as consumer interest in AI-powered search grows.
        - The article discusses the increasing demand for generative AI tools and AI-powered `,
        content: `- Google's Search Generative Experience (SGE) continues to evolve as consumer interest in AI-powered search grows.
        - The article discusses the increasing demand for generative AI tools and AI-powered search, the impact of Google SGE on search results, and the potential marketing strategies for adapting to generative AI search experiences.
        - It also covers Google's focus on enhancing search with AI, user trust in AI-powered search results, and the challenges related to copyright concerns and organic search traffic.`,
        meta: `{"keywords":"Google SGE, Generative AI, AI-powered search, consumer interest, marketing strategies, user trust, copyright concerns, organic search traffic"}`,
        sourceType: 'weblink',
        sources: `[{"medadata":{"title":"Google SGE And Generative AI In Search: What To Expect In 2024","source":"https://www.searchenginejournal.com/google-sge-and-generative-ai-in-search-what-to-expect-in-2024/504578/"}}]`,
      },
      {
        title: `LangSmith Overview and User Guide | 🦜️🛠️ LangSmith`,
        abstract: `- LangSmith provides tracing capabilities for monitoring and debugging applications during testing.
        - It allows quick editing of examples and addition to datasets for evaluation and model fine-tuning.`,
        content: `- LangSmith provides tracing capabilities for monitoring and debugging applications during testing.
        - It allows quick editing of examples and addition to datasets for evaluation and model fine-tuning.
        - LangSmith can monitor applications in production, log feedback, and pinpoint underperforming data points.
        - It simplifies rigorous testing by using existing or handcrafted datasets to evaluate application performance.`,
        meta: `{"keywords":"LangSmith, tracing, monitoring, debugging, testing, evaluation, feedback, datasets, applications, production, underperforming data points, model fine-tuning, rigorous testing"}`,
        sourceType: 'weblink',
        sources: `[{"medadata":{"title":"Quickstart | 🦜️🔗 Langchain","source":"https://python.langchain.com/docs/modules/agents/quick_start"}}]`,
      },
    ];
    const res = await service.summarizeMultipleWeblink(docs as any);
    expect(res).toEqual({
      title: '',
      content: '',
    });
  });

  it('generateAskFollowupQuestionSchema', async () => {
    const docs = [
      {
        pageContent: `- Google's Search Generative Experience (SGE) continues to evolve as consumer interest in AI-powered search grows.
        - The article discusses the increasing demand for generative AI tools and AI-powered search, the impact of Google SGE on search results, and the potential marketing strategies for adapting to generative AI search experiences.
        - It also covers Google's focus on enhancing search with AI, user trust in AI-powered search results, and the challenges related to copyright concerns and organic search traffic.`,
        meta: {
          title:
            'Google SGE And Generative AI In Search: What To Expect In 2024',
          source:
            'https://www.searchenginejournal.com/google-sge-and-generative-ai-in-search-what-to-expect-in-2024/504578/',
        },
      },
      {
        pageContent: `- LangSmith provides tracing capabilities for monitoring and debugging applications during testing.
        - It allows quick editing of examples and addition to datasets for evaluation and model fine-tuning.
        - LangSmith can monitor applications in production, log feedback, and pinpoint underperforming data points.
        - It simplifies rigorous testing by using existing or handcrafted datasets to evaluate application performance.`,
        meta: {
          title: 'Quickstart | 🦜️🔗 Langchain',
          source:
            'https://python.langchain.com/docs/modules/agents/quick_start',
        },
      },
    ];
    const res = await service.getRelatedQuestion(docs as any, '');
    console.log('getRelatedQuestion', res);
    expect(res).toEqual({
      title: '',
      content: '',
    });
  });

  it('testOnlineSearch', async () => {
    const question = `Refly 是什么？`;
    const res = await service.onlineSearch(question);
    console.log('searchResults', res);
    expect(res).toEqual({
      title: '',
      content: '',
    });
  });

  it('summarizeConversation', async () => {
    const chatMessages = [
      {
        type: 'human',
        content: '什么是 refly',
      },
      {
        type: 'ai',
        content: `"Refly"是一个动词，意思是再次飞行或重新乘飞机。这个词源于英文中的“re-”表示“再次”，加上“fly”表
        示“飞行”[citation](1). 在某些语境下，例如在航空领域，refly也可以指再次驾驶飞机[citation](2).此外，Refly也可以是一个公司
        或服务的名称，比如在航班市场中帮助旅客出售机票的对等市场平台[citation](3)，或者是一个专门帮助旅客获得机票赔偿的可信赖合
        作伙伴[citation](4)。NASA也曾表示希望在他们计划的太空飞行任务中，再次飞行携带旗帜[citation](5)。Refly还有其他反身动词形
        式和相关的词汇，但总体含义都与飞行相关[citation](6)。`,
      },
    ];
    const text = await service.summarizeConversation(chatMessages);
    expect(text).toEqual('');
  });
});
