import { Document } from '@langchain/core/documents';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../../base';
// schema
import { z } from 'zod';
import { SearchResponse, SkillInvocationConfig } from '@refly/openapi-schema';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { loadSummarizationChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { scrapeWeblink } from '@refly/utils';

interface GraphState extends BaseSkillState {
  documents: Document[];
  messages: BaseMessage[];
}

// Define a new graph
/**
 *
 * @param url
 * @returns
 *
 * 1. 判断 url 是否是 arxiv 的 url（同样适用于其他网页）
 * 2. 判断是否在库里存在，不存在入库
 * 3. 判断需求是 summary、还是 common question，还是知识库独特的内容
 * 4. 根据需求，调用不同的工具
 * 5. 总结同时支持总结 + 追问，支持发 url 在主站使用，或者在插件里面感知使用
 */
async function fetchPDF(url) {
  const response = await fetch(url);
  const pdfBlob = await response.blob();
  return pdfBlob;
}

export class ArxivSummarySkill extends BaseSkill {
  name = 'arxiv_summary';
  displayName = {
    en: 'Arxiv Summary',
    'zh-CN': 'Arxiv 总结',
  };

  invocationConfig: SkillInvocationConfig = {
    inputRules: [{ key: 'query' }],
    contextRules: [{ key: 'contentList' }],
  };

  description = 'Give a summary of the arxiv content';

  schema = z.object({
    query: z.string().describe('The user query'),
  });

  graphState: StateGraphArgs<GraphState>['channels'] = {
    ...baseStateGraphArgs,
    documents: {
      reducer: (left?: Document[], right?: Document[]) => (right ? right : left || []),
      default: () => [],
    },
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  };

  async passThroughGenerate(state: GraphState, config?: SkillRunnableConfig) {
    this.engine.logger.log('---GENERATE---');

    const { query = '' } = state;
    const { locale = 'en', urls = [] } = config?.configurable || {};

    const url = query || urls[urls.length - 1];

    const llm = this.engine.chatModel({
      temperature: 0.1,
    });

    const systemPrompt = `Please directly notify user the url: **${url}** is not an arxiv url in ${locale} language`;
    const response = await llm.invoke([new SystemMessage(systemPrompt)]);

    return { messages: [new AIMessage(response)] };
  }

  // check whether the resource is already in the knowledge base
  async checkUrl(state: GraphState, config?: SkillRunnableConfig) {
    this.engine.logger.log('---GENERATE---');

    const { query = '' } = state;
    const { urls = [] } = config?.configurable || {};

    // check if the url is valid
    const url = query || urls[urls.length - 1];
    const isDetailUrl = url.includes('abs') || url.includes('pdf');
    if (!url || !url.startsWith('https://arxiv.org') || !isDetailUrl) {
      return 'passThroughGenerate';
    }

    return 'generate';
  }

  async generate(state: GraphState, config?: SkillRunnableConfig) {
    this.engine.logger.log('---GENERATE---');

    const { query = '' } = state;
    const { locale = 'en', contentList = [], resourceIds = [], noteIds = [], urls = [] } = config?.configurable || {};

    const url = query || urls[urls.length - 1];

    // check if the url is https://arxiv.org/abs/2406.18532 or pdf version: https://arxiv.org/pdf/2406.18532
    const pdfUrl = url.includes('abs') ? url.replace('abs', 'pdf') : url;
    const pdfBlob = await fetchPDF(pdfUrl);
    const loader = new WebPDFLoader(pdfBlob, { splitPages: false });
    const docs = await loader.load();

    // add to resource for knowledge qa
    if (docs?.length > 0) {
      const { user } = config;
      const websiteUrl = url.includes('abs') ? url : url.replace('pdf', 'abs');
      const { title } = await scrapeWeblink(websiteUrl);

      // add to resource for knowledge qa
      await this.engine.service.createResource(user, {
        resourceType: 'text',
        content: docs[0].pageContent,
        data: {
          url: websiteUrl,
          title,
        },
        title,
      });
    }

    const llm = this.engine.chatModel({
      temperature: 0.5,
    });
    const systemPrompt = new PromptTemplate({
      template: `You are an AI assistant tasked with summarizing academic papers. Please provide a concise summary of the given text. 
    
    ## Required Output
    1. Mark the title of the paper (with Chinese translation)
    2. list all the authors' names (use English)
    3. mark the first author's affiliation (output ${locale} translation only)                 
    4. mark the keywords of this article (use English)
    5. link to the paper, Github code link (if available, fill in Github:None if not)
    6. summarize according to the following four points.Be sure to use ${locale} answers (proper nouns need to be marked in English)
      - (1):What is the research background of this article?
      - (2):What are the past methods? What are the problems with them? Is the approach well motivated?
      - (3):What is the research methodology proposed in this paper?
      - (4):On what task and what performance is achieved by the methods in this paper? Can the performance support their goals?
    Follow the format of the output that follows:                  
    1. Title: xxx\n\n
    2. Authors: xxx\n\n
    3. Affiliation: xxx\n\n                 
    4. Keywords: xxx\n\n   
    5. Urls: xxx or xxx , xxx \n\n      
    6. Summary: \n\n
      - (1):xxx;\n 
      - (2):xxx;\n 
      - (3):xxx;\n  
      - (4):xxx.\n\n     
    
    Be sure to use ${locale} answers (proper nouns need to be marked in English), statements as concise and academic as possible, do not have too much repetitive information, numerical values using the original numbers, be sure to strictly follow the format, the corresponding content output to xxx, in accordance with \n line feed.`,
      inputVariables: [],
    });
    const summarizeChain = loadSummarizationChain(llm, { type: 'map_reduce', combinePrompt: systemPrompt });

    const splitter = new TokenTextSplitter({
      chunkSize: 10000,
      chunkOverlap: 250,
    });
    const splittedDocs = await splitter.createDocuments([docs[0].pageContent]);

    const summary = (await summarizeChain.stream({ input_documents: splittedDocs })) as any as string;
    console.log('summary', summary);

    return { messages: [new AIMessage({ content: summary })] };
  }

  toRunnable() {
    const workflow = new StateGraph<GraphState>({
      channels: this.graphState,
    })
      .addNode('generate', this.generate.bind(this))
      .addEdge(START, 'generate')
      .addEdge('generate', END);

    return workflow.compile();
  }
}
