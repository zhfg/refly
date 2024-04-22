import scrapy
import json


class ReflySpider(scrapy.Spider):
    name = "refly_spider"
    allowed_domains = ["unstructured-io.github.io"]
    start_urls = ["https://unstructured-io.github.io/unstructured/introduction.html"]

    def __init__(self, *args, **kwargs):
        super(ReflySpider, self).__init__(*args, **kwargs)
        self.data = []

    def parse(self, response):
        self.data.append(
            {
                "url": response.url,
                "title": response.css("title::text").get(),
            }
        )

        for link in response.css("a::attr(href)"):
            yield response.follow(link.get(), callback=self.parse)

    def close(self, reason):
        with open(f"{self.allowed_domains[0]}.json", "w") as f:
            json.dump(self.data, f, indent=2)
