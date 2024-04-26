import express from "express";
import bodyParser from "body-parser";
import "cheerio";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {
  OpenAIEmbeddings,
  ChatOpenAI,
  formatToOpenAITool,
} from "@langchain/openai";
import { pull } from "langchain/hub";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { BasePromptTemplate } from "langchain/prompts";
import { BaseOutputParser } from "langchain/schema/output_parser";
import { RunnablePassthrough, RunnableSequence } from "langchain/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { Runnable } from "langchain/runnables";
import { Document } from "langchain/document";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "langchain/schema";

import { CitedAnswer } from "./tools/cite-documents";

const app = express();
const PORT = 3001;

let vectorStore: MemoryVectorStore;
let chatHistory: (AIMessage | HumanMessage | SystemMessage)[] = [];

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World for ReflyAI");
});

app.post("/api/indexing-website", async (req, res) => {
  const { url } = req.body;
  console.log("indexing with url", url);

  try {
    const loader = new CheerioWebBaseLoader(url);

    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments(docs);
    vectorStore = await MemoryVectorStore.fromDocuments(
      splits,
      new OpenAIEmbeddings()
    );

    res.send({
      error: 0,
      message: "url has been processed successfully",
    });
  } catch (err: any) {
    res.send({
      error: 1,
      message: err?.message,
    });
  }
});

app.get("/api/generate/gen", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.status(200);

  const { q } = req.query;
  const query = q as string;
  console.log("activated with query", query);

  const qaSystemPrompt = `You are an assistant for question-answering tasks.
  Use the following pieces of retrieved context to answer the question.
  If you don't know the answer, just say that you don't know.
  Use three sentences maximum and keep the answer concise.
  
  {context}`;
  const contextualizeQSystemPrompt = `Given a chat history and the latest user question
which might reference context in the chat history, formulate a standalone question
which can be understood without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.`;

  // Retrieve and generate using the relevant snippets of the blog.
  const retriever = vectorStore.asRetriever();
  // const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  const llm = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0 });

  const citedAnswerTool = formatToOpenAITool(new CitedAnswer());
  const llmWithTool = llm.bind({
    tools: [citedAnswerTool],
    tool_choice: citedAnswerTool,
  });

  // 构建总结的 Prompt，将 question + chatHistory 总结成
  const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt],
    new MessagesPlaceholder("chatHistory"),
    ["human", "{question}"],
  ]);
  const contextualizeQChain = contextualizeQPrompt
    .pipe(llm as any)
    .pipe(new StringOutputParser());
  const questionWithContext =
    chatHistory.length === 0 || chatHistory.length === 1
      ? query
      : await contextualizeQChain.invoke({
          question: query,
          chatHistory,
        });

  // 添加 Human Message
  chatHistory = chatHistory.concat(new HumanMessage({ content: query }));

  const qaPrompt = ChatPromptTemplate.fromMessages([
    ["system", qaSystemPrompt],
    new MessagesPlaceholder("chatHistory"),
    ["human", "{question}"],
  ]);

  // 提供 Citations
  // Citations 低优
  // const formatDocsWithId = (docs: Array<Document>): string => {
  //   return (
  //     "\n\n" +
  //     docs
  //       .map(
  //         (doc: Document, idx: number) =>
  //           `Source ID: ${idx}\nArticle Snippet: ${doc.pageContent}`
  //       )
  //       .join("\n\n")
  //   );
  // };

  // 基于上下文进行问答
  const ragChain = await createStuffDocumentsChain({
    llm,
    prompt: qaPrompt,
    outputParser: new StringOutputParser(),
  });
  const retrievedDocs = await retriever.getRelevantDocuments(
    questionWithContext
  );
  const answerStream = await ragChain.stream({
    question: query,
    context: retrievedDocs,
    chatHistory,
  });

  // 进行流式问答
  let answerStr = "";
  for await (const chunk of answerStream) {
    answerStr += chunk;
    res.write(`data: ${chunk}\n\n`);
  }
  chatHistory = chatHistory.concat(new AIMessage({ content: answerStr }));

  res.end(`data: [DONE]\n\n`);
});

app.listen(PORT, () => {
  console.log(`app is listening at http://localhost:${PORT}`);
});
