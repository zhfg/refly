import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from llama_index.embeddings.openai import OpenAIEmbedding  # type:ignore
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.extractors import TitleExtractor
from llama_index.core.ingestion import IngestionPipeline, IngestionCache
from llama_index.core import VectorStoreIndex
from llama_index.core.readers.base import BaseReader
from llama_index.core.ingestion.cache import SimpleCache
from llama_index.readers.web.async_web.base import AsyncWebPageReader  # type:ignore

from app.models.dto import VisitLink

logger = logging.getLogger(__name__)

APP_HOST = "0.0.0.0"
APP_PORT = 8080


def get_application() -> FastAPI:
    application = FastAPI(title="Refly Backend")

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Change this to the list of allowed origins if needed
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = get_application()

index = VectorStoreIndex([])
pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=25, chunk_overlap=0),
        TitleExtractor(),
        OpenAIEmbedding(),
    ],
    cache=IngestionCache(cache=SimpleCache()),
)


@app.post("/store-links")
def report_links(links: list[VisitLink]):
    loader = BaseReader()

    documents = loader.load_data()
    nodes = pipeline.run(documents=documents)
    index.insert_nodes(nodes)


@app.get("/query")
def query():
    engine = index.as_query_engine()
    engine.query()


@app.get("/chat")
def chat():
    engine = index.as_chat_engine()
    engine.chat()


if __name__ == "__main__":
    logger.info(f"Starting reflyd on http://{APP_HOST}:{str(APP_PORT)}/")
    uvicorn.run(
        app,
        host=APP_HOST,
        port=APP_PORT,
    )
