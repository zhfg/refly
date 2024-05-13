from unstructured.partition.md import partition_md
from langchain_text_splitters import MarkdownHeaderTextSplitter


# load documents
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]

with open('./jina_data/intro.md') as fp:
    markdown_document = fp.read()

markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on, strip_headers=False)
md_header_splits = markdown_splitter.split_text(markdown_document)

for split in md_header_splits:
    print(split.page_content)
    print("~" * 180)

# for chunk in chunks:
#     print(chunk.text)
#     print("-" * 80)
