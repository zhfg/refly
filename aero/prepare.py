from unstructured.partition.html import partition_html
from unstructured.cleaners.core import clean
from unstructured.chunking.title import chunk_by_title

# url = "https://unstructured-io.github.io/unstructured/introduction.html"
chunks = partition_html(url='https://refly.ai/', chunking_strategy='by_title', max_characters=1000, new_after_n_chars=800)
# chunks = partition_html(
#     filename="./html_files/https_unstructured-io.github.io_unstructured_introduction.html.html",
# )

chunks = [chunk for chunk in chunks if len(chunk.text.split()) > 10]

chunks = chunk_by_title(chunks, max_characters=1200, new_after_n_chars=800)

# chunks = partition_html(url=url, chunking_strategy='basic', max_characters=1000, new_after_n_chars=800, overlap=400)

# print([clean(chunk.text, extra_whitespace=True) for chunk in chunks])
for chunk in chunks:
    # print(chunk.to_dict())
    print(clean(chunk.text, extra_whitespace=True))
    print("-" * 50)
