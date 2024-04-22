import pickle
import os
import json
import requests

import weaviate
import weaviate.classes as wvc
from weaviate.classes.query import MetadataQuery, HybridFusion
from weaviate.auth import AuthApiKey
from weaviate.util import generate_uuid5
from weaviate.classes.config import Configure, Property, DataType

from langchain_text_splitters import CharacterTextSplitter

COLLECTION_NAME = "Refly"
READER_URL = "https://r.jina.ai/"

client = weaviate.connect_to_wcs(
    cluster_url=os.environ['WEAVIATE_CLUSTER_URL'],
    auth_credentials=AuthApiKey(os.environ['WEAVIATE_API_KEY']),
    skip_init_checks=True,
    headers={
        "X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY"),
    }
)


def init_collection():
    if client.collections.exists(COLLECTION_NAME):
        return

    client.collections.create(
        COLLECTION_NAME,
        properties=[
            Property(name="url", data_type=DataType.TEXT),
            Property(name="type", data_type=DataType.TEXT),
            Property(
                name="title",
                data_type=DataType.TEXT,
                index_filterable=True,
                index_searchable=True,
            ),
            Property(
                name="content",
                data_type=DataType.TEXT,
                index_filterable=True,
                index_searchable=True,
            ),
        ],
        vectorizer_config=[
            Configure.NamedVectors.text2vec_openai(
                name="content",
                model="text-embedding-3-large",
                dimensions=256,
                source_properties=["content"],
            )
        ],
    )


def store_link(url: str, title: str):
    resp = requests.get(READER_URL + url)
    text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
        encoding_name="cl100k_base", chunk_size=800, chunk_overlap=400
    )
    texts = text_splitter.split_text(resp.text)
    print(f'processing {url} with {len(texts)} chunks')

    collection = client.collections.get("Refly")
    data_objects = list()

    for chunk in texts:
        properties = {
            "url": url,
            "type": "weblink",
            "title": title,
            "content": chunk,
        }
        # print(properties)
        data_objects.append(
            wvc.data.DataObject(properties=properties, uuid=generate_uuid5(properties))
        )

    res = collection.data.insert_many(data_objects)
    print(res)


def load_html_from_local_pickle(fpath: str):
    with open(fpath, "rb") as f:
        data = pickle.load(f)

    for item in data[:2]:
        print(item)
        store_link(item["url"], item["title"], item["html"])


def load_html_from_local_json(fpath: str):
    with open(fpath, "r") as f:
        data = json.load(f)

    for item in data:
        store_link(item["url"], item["title"])


def read_data():
    collection = client.collections.get(COLLECTION_NAME)

    for item in collection.iterator(include_vector=True):
        print(item.uuid, len(item.vector['content']))


def search_data(query: str):
    collection = client.collections.get(COLLECTION_NAME)
    response = collection.query.hybrid(
        query=query,
        limit=3,
        return_metadata=MetadataQuery(score=True, explain_score=True),
    )

    for o in response.objects:
        print(o.properties)
        print(o.metadata.score, o.metadata.explain_score)


def delete_data_objects():
    collection = client.collections.get(COLLECTION_NAME)

    for item in collection.iterator():
        print('delete', item.uuid)
        collection.data.delete_by_id(item.uuid)


if __name__ == "__main__":
    try:
        init_collection()
        # store_link('https://unstructured-io.github.io/unstructured/core/chunking.html', 'chunking')
        # delete_data_objects()
        # load_html_from_local_json('./data/mp.weixin.json')
        search_data('Linus')
        # load_html_from_local_pickle('./unstructured-io.github.io.pickle')
        # read_data()
    finally:
        client.close()
