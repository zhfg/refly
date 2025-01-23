<div align="center">

<h1 align="center" style="border-bottom: none">
    <b>
        <a href="https://www.refly.ai">Refly.AI</a><br>
    </b>
    ⭐️  The AI Native Creation Engine ⭐️ <br>
</h1>

Refly is an open-source AI-native creation engine. Refly's intuitive free-form canvas interface combines multi-threaded conversations, knowledge base RAG integration, contextual memory, intelligent search, WYSIWYG AI editor and more, empowering you to effortlessly transform ideas into production-ready content.

[🚀 Refly v0.2.3 Released! Featuring Enhanced Product Onboarding!](https://docs.refly.ai/changelog/v0.2.3)

[Refly Cloud](https://refly.ai/) · [Self-hosting](https://refly.ai/) · [Forum](https://github.com/refly-ai/refly/discussions) · [Discord](https://discord.gg/bWjffrb89h) · [Twitter](https://x.com/reflyai) · [Documentation](https://x.com/reflyai)

</div>

![refly-cover](https://github.com/user-attachments/assets/6df63040-1708-462b-849e-5114f7f53f09)

## Quick Start

### Local Development

> Before installing ReflyAI, ensure your machine meets these minimum system requirements:
>
> CPU >= 2 cores
>
> Memory >= 4GB

The easiest way to start the ReflyAI server is to run our docker-compose.yml file. Before running the installation commands, make sure Docker and Docker Compose are installed on your machine:

```bash
cd docker
cp .env.example .env
docker compose up -d
```

After running, you can access http://localhost/install in your browser to enter the ReflyAI control panel and begin the initialization process.

> If you want to contribute code to ReflyAI or perform additional development, please refer to our source code deployment guide.

**Next Steps**

For custom configurations, refer to the comments in the [.env.example](https://www.refly.ai/) file and update the corresponding values in your .env file. Additionally, you may need to adjust the docker-compose.yaml file itself according to specific deployment environments and requirements, such as changing image versions, port mappings, or volume mounts. After making any changes, please re-run docker compose up -d. You can find a complete list of all available environment variables [here](https://www.refly.ai/).

### Private Deployment

If you want to configure high-availability setups, there are community-contributed Helm Charts and YAML files that allow deployment of ReflyAI on Kubernetes.

- Helm Chart by [@LeoQuote](https://github.com/douban/charts/tree/master/charts/dify)
- Helm Chart by [@BorisPolonsky](https://github.com/douban/charts/tree/master/charts/dify)
- YAML files by [@Winson-030](https://github.com/douban/charts/tree/master/charts/dify)

### Deploy with Docker

Deploy your own feature-rich, unlimited version of ReflyAI using Docker. Our team is working hard to keep up with the latest versions. For more information on self-hosting ReflyAI, please refer to our [documentation](https://docs.affine.pro/docs/self-host-affine).

To start deployment:

```bash
docker pull ghcr.io/reflyai/reflyai:latest
docker run -d -p 3000:3000 ghcr.io/reflyai/reflyai:latest
```

Visit [http://localhost:3000](http://localhost:3000/) to start using ReflyAI.

### **Deploy with Terraform**

**Azure Global**

Deploy ReflyAI to Azure with one click using terraform.

- [Azure Terraform by @nikawang](https://github.com/douban/charts/tree/master/charts/dify)

## Features

1. **Multi-threaded dialogues:** Refly implements an innovative multi-threaded dialogues mechanism that allows you to freely switch between multiple independent conversation topics. This enables more fluid and natural thought expansion and in-depth discussions, effectively breaking through the limitations of traditional conversations. It helps build complex and effective **Agentic Workflows** in **human-AI collaboration**.
2. **AI-Powered Capabilities:** Leveraging AI models, after inputting a question, users can flexibly select any node on the canvas as context to generate new node content. This includes **AI web search, AI knowledge base search, AI-recommended questions, and AI document smart generation**. It integrates capabilities like Perplexity AI and Stanford Storm into a single workspace.
3. **Context Memory:** Providing precise temporary knowledge base support for each conversation, ensuring the AI model can accurately understand and respond to your questions. Similar to Cursor, you can flexibly select any node in the canvas or add references as context.
4. **Knowledge Base Integration:** Supports importing diverse external resources and intelligently integrating them into the canvas based on your needs. This helps build a comprehensive knowledge system and create a personalized thinking space. With intelligent retrieval technologies like RAG (Retrieval-Augmented Generation), you can make semantic queries, making it a true second brain.
5. **Quotes:** Support flexible selection of content from various resources, documents, memos, or skill outputs, allowing one-click addition as contextual references to enhance the accuracy and depth of conversations.
6. **AI Document Editing:** Beyond providing powerful real-time Markdown editing capabilities, it supports intelligent selection of document content and AI-assisted precise modifications and refinements based on your needs, offering you a Notion-like powerful AI editor.

## How to Use?

- **Cloud**
  - We've deployed a Refly Cloud version that allows zero-configuration usage, offering all capabilities of the self-hosted version, including free access to GPT-4o-mini and limited trials of GPT-4o and Claude-3.5-Sonnet
- **Self-hosting Refly Community Edition**
  - Get started quickly with our [Getting Started Guide](https://docs.refly.ai/) to run Refly in your environment. For more detailed references and in-depth instructions, please refer to our documentation.
- **Refly for enterprise / organizations**

## Stay Updated

> Star Us

Star Refly on GitHub to receive instant notifications about new version releases.

![stay-tuned](https://github.com/user-attachments/assets/877dfeb7-1088-41f1-9176-468d877ded0a)

## Contributing Guidelines

| Bug Reports                                      | Feature Requests                                      | Issues/Discussions                                     | ReflyAI Community                                        |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| [Create Bug Report](https://udify.app/chat/link) | [Submit Feature Request](https://udify.app/chat/link) | [View GitHub Discussions](https://udify.app/chat/link) | [Visit ReflyAI Community](https://udify.app/chat/link)   |
| Something isn't working as expected              | Ideas for new features or improvements                | Discuss and raise questions                            | A place to ask questions, learn, and connect with others |

We welcome all developers, testers, technical writers, and more! We welcome various types of contributions, and you can learn more in [docs/types-of-contributions.md](https://github.com/toeverything/AFFiNE/blob/canary/docs/types-of-contributions.md). If you're interested in contributing code, please read our [docs/CONTRIBUTING.md](https://github.com/toeverything/AFFiNE/blob/canary/docs/CONTRIBUTING.md) and feel free to check out our GitHub issues to show us what you can do.

Before starting to contribute, please ensure you've read and accepted our [Contributor License Agreement](https://github.com/toeverything/affine/edit/canary/.github/CLA.md). To indicate agreement, simply edit this file and submit a pull request.

For bug reports, feature requests, and other suggestions, you can also [create a new issue](https://github.com/toeverything/AFFiNE/issues/new/choose) and choose the most appropriate template to provide feedback.

For translations and language support, you can visit our [i18n General Space](https://community.affine.pro/c/i18n-general).

Looking for other ways to contribute and don't know where to start? Check out the [ReflyAI Ambassador Program](https://community.affine.pro/c/start-here/affine-ambassador), where we work closely with passionate community members and provide extensive support and resources.

If you have any questions, feel free to reach out to us. One of the best places to get more information and learn is the [ReflyAI Community](https://community.affine.pro/home), where you can connect with other like-minded individuals.

## Community and Contact

- [GitHub Discussion](https://github.com/refly-ai/refly/discussions): Best for sharing feedback and asking questions.
- [GitHub Issues](https://github.com/refly-ai/refly/issues): Best for reporting bugs and suggesting features when using ReflyAI. Please refer to our contribution guidelines.
- [Discord](https://discord.gg/bWjffrb89h): Best for sharing your applications and interacting with the community.
- [Twitter](https://x.com/reflyai): Best for sharing your applications and staying connected with the community.

## Security Issues

To protect your privacy, please avoid posting security-related issues on GitHub. Instead, send your questions to [support@refly.ai](mailto:support@refly.ai), and we will provide you with a more detailed response.

## License

This repository is licensed under the [ReflyAI Open Source License](https://github.com/langgenius/dify/blob/main/LICENSE), which is essentially the Apache 2.0 License with some additional restrictions.
