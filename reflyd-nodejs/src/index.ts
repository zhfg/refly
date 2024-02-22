import express from "express";
import bodyParser from "body-parser";
import "cheerio";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

const app = express();
const PORT = 3000;
let vectorStore: MemoryVectorStore;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World for ReflyAI");
});

app.post("/indexing", async (req, res) => {
  const { url } = req.body;
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

app.get("/query", async (req, res) => {
  const { q } = req.query;
  const query = q as string;

  // Retrieve and generate using the relevant snippets of the blog.
  const retriever = vectorStore.asRetriever();
  const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  const llm = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0 });

  const ragChain = await createStuffDocumentsChain({
    llm,
    prompt,
    outputParser: new StringOutputParser(),
  });

  const retrievedDocs = await retriever.getRelevantDocuments(query);
  const answer = await ragChain.invoke({
    question: query,
    context: retrievedDocs,
  });

  res.send({
    answer,
    ragPrompt: prompt,
    retrievedDocs,
  });
});

app.listen(PORT, () => {
  console.log(`app is listening at http://localhost:${PORT}`);
});
