with open("./jina_data/mp.md") as f:
    text = f.read()

from langchain_text_splitters import CharacterTextSplitter

text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base", chunk_size=800, chunk_overlap=400
)
texts = text_splitter.split_text(text)

for text in texts:
    print(text)
    print("=" * 280)