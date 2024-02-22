import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from llama_index.embeddings.openai import OpenAIEmbedding  # type:ignore
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.extractors import TitleExtractor
from llama_index.core.ingestion import IngestionPipeline, IngestionCache
from llama_index.core import VectorStoreIndex
from llama_index.core.ingestion.cache import SimpleCache
from llama_index.readers.web.simple_web.base import SimpleWebPageReader  # type:ignore

from app.models.dto import VisitLink, QueryResponse

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

index = VectorStoreIndex(nodes=[])
pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=25, chunk_overlap=0),
        TitleExtractor(),
        OpenAIEmbedding(),
    ],
    cache=IngestionCache(cache=SimpleCache()),
)


@app.post("/sync-links")
def sync_links(links: list[VisitLink]):
    """Sync browser links."""
    loader = SimpleWebPageReader()
    documents = loader.load_data(urls=[l.url for l in links])
    nodes = pipeline.run(documents=documents)
    logger.info(f"nodes created: {nodes}")
    index.insert_nodes(nodes)

    # TODO: persist index

    return {}


@app.get("/query")
def query(q: str):
    engine = index.as_query_engine(response_mode="refine", similarity_top_k=5)
    resp = engine.query(q)
    return QueryResponse(result=str(resp))


@app.get("/chat")
def chat():
    # TODO: finish this
    engine = index.as_chat_engine()
    engine.chat()
    return {}


if __name__ == "__main__":
    logger.info(f"Starting reflyd on http://{APP_HOST}:{str(APP_PORT)}/")
    uvicorn.run(
        app,
        host=APP_HOST,
        port=APP_PORT,
    )
