<div align="center">

<h1 align="center" style="border-bottom: none">
    <b>
        <a href="https://www.refly.ai">Refly.AI</a><br>
    </b>
    ⭐️  AI Native 内容创作引擎 ⭐️ <br>
</h1>

![refly-cover](https://github.com/user-attachments/assets/2930c555-09a7-4ea2-a18a-2b1d8a7ef4ae)

Refly 是一个开源的 AI 原生创作引擎。Refly 直观的自由画布界面集成了多线程对话、RAG 检索流程、上下文记忆、智能搜索和 AI 文档编辑等功能，让您轻松地将创意转化为完整作品。

[🚀 Refly v0.2.3 正式发布！全新升级产品引导体验！](<[https://x.com/reflyai](https://docs.refly.ai/changelog/v0.2.3)>)

[Refly Cloud](https://refly.ai/) · [Self-hosting](https://refly.ai/) · [Forum](https://github.com/refly-ai/refly/discussions) · [Discord](https://discord.gg/bWjffrb89h) · [Twitter](https://x.com/reflyai) · [Documentation](https://x.com/reflyai)

</div>

## 快速开始

### 本地开发

> 在安装 ReflyAI 之前，请确保您的机器满足以下最低系统要求：
>
> CPU >= 2 核
>
> 内存 >= 4GB

启动 ReflyAI 服务器最简单的方法是运行我们的 docker-compose.yml 文件。在运行安装命令之前，请确保您的机器上已安装 Docker 和 Docker Compose：

```
cd docker
cp .env.example .env
docker compose up -d

```

运行后，您可以在浏览器中访问 http://localhost/install 进入 ReflyAI 控制面板并开始初始化过程。

> 如果您想为 ReflyAI 贡献代码或进行额外的开发，请参考我们的源代码部署指南。

**后续步骤**

如需自定义配置，请参考 [.env.example](https://www.refly.ai/) 文件中的注释，并在您的 .env 文件中更新相应的值。此外，您可能需要根据特定的部署环境和要求调整 docker-compose.yaml 文件本身，如更改镜像版本、端口映射或卷挂载。做出任何更改后，请重新运行 docker compose up -d。您可以在[这里](https://www.refly.ai/)找到所有可用环境变量的完整列表。

### 私有化部署

如果您想配置高可用性设置，有社区贡献的 Helm Charts 和 YAML 文件，允许在 Kubernetes 上部署 ReflyAI。

- [@LeoQuote](https://github.com/douban/charts/tree/master/charts/dify) 提供的 Helm Chart
- [@BorisPolonsky](https://github.com/douban/charts/tree/master/charts/dify) 提供的 Helm Chart
- [@Winson-030](https://github.com/douban/charts/tree/master/charts/dify) 提供的 YAML 文件

### 使用 Docker 部署

使用 Docker 部署您自己的功能丰富、无限制版本的 ReflyAI。我们的团队正在努力更新到最新版本。有关如何自托管 ReflyAI 的更多信息，请参阅我们的[文档](https://docs.affine.pro/docs/self-host-affine)。

开始部署：

```
Bash
1docker pull ghcr.io/reflyai/reflyai:latest
2docker run -d -p 3000:3000 ghcr.io/reflyai/reflyai:latest

```

访问 [http://localhost:3000](http://localhost:3000/) 开始使用 ReflyAI。

### **使用 Terraform 进行部署**

**Azure 全球**

使用 terraform 一键将 ReflyAI 部署到 Azure。

- [@nikawang 提供的 Azure Terraform](https://github.com/douban/charts/tree/master/charts/dify)

## 特性

1. **多线程对话：**Refly 采用创新的多线程对话机制，让您能够自由切换多个独立对话主题，实现更流畅自然的思维发散与深入探讨，有效突破传统对话的局限性，在人机协作过程中构建复杂且有效的 Agentic Workflow。

https://github.com/user-attachments/assets/9dbff21f-cf01-42e7-a76f-eb16b1a11c97

2. **AI 驱动的技能：**借助 AI 模型驱动，输入问题后，可灵活选取画布中的任一节点作为上下文，生成新的节点内容，包括 AI 全网搜索、AI 知识库搜索、AI 推荐提问和 AI 文档智能生成等，将 Perplexity AI、Standford Storm 等能力整合在一处工作空间。

https://github.com/user-attachments/assets/be4e18f9-07bb-4b91-90a5-ee2c27bfbf6f

3. **上下文：**为每次对话提供精确的临时知识库支持，确保 AI 模型能准确理解和回应您的问题。与 Cursor 类似，您可以灵活选择画布中的任意节点或添加引用作为上下文。

https://github.com/user-attachments/assets/fd95abae-8090-4a6f-a67b-99246568f5d7

4. **知识库整合：**支持导入多样化的外部资源，根据需求智能整合到画布中，构建完整的知识体系，打造个性化的思维空间，还能通过 RAG 等智能检索技术进行语义提问，是真正的第二大脑。

https://github.com/user-attachments/assets/263425a8-ed18-4765-9c6a-020fcd867ab2

5. **引文：**支持从各类资源、文档、备忘录或技能输出中灵活选取内容，一键添加为上下文引用，提升对话的准确性和深度。

https://github.com/user-attachments/assets/27725ad6-cca2-490a-ba50-59a9577dd174

6. **AI 文档编辑：**除提供强大的 Markdown 实时编辑功能外，支持智能选中文档内容，根据您的需求进行 AI 辅助的精准修改和润色，提供给您一个类 Notion 的强大 AI 编辑器。

https://github.com/user-attachments/assets/9f11b8eb-dd9d-4691-aca1-d3f11ff801ab

## 如何使用 ？

- **Cloud**
  - 我们部署了一个 Refly Cloud 版本，允许你 0 配置使用，它提供了和私有化部署版本的全部能力，包括免费使用的 GPT-4o-mini 和限量体验的 GPT-4o 和 Claude-3.5-Sonnet
- **Self-hosting Refly Community Edition**
  - 通过这份[入门指南](https://docs.refly.ai/)，快速在您的环境中运行 Refly。更详细的参考和深入说明，请查阅我们的文档。
- ## **Refly for enterprise / organizations**

## 保持关注

在 GitHub 上给 Refly 星标，即可即时接收新版本发布的通知。

![stay-tuned](https://github.com/user-attachments/assets/877dfeb7-1088-41f1-9176-468d877ded0a)

## 贡献指南

表格 还在加载中，请等待加载完成后再尝试复制

欢迎所有开发者、测试人员、技术写作者等加入！我们欢迎各种类型的贡献，您可以在 [docs/types-of-contributions.md](https://github.com/toeverything/AFFiNE/blob/canary/docs/types-of-contributions.md) 中了解更多信息。如果您有兴趣贡献代码，请阅读我们的 [docs/CONTRIBUTING.md](https://github.com/toeverything/AFFiNE/blob/canary/docs/CONTRIBUTING.md)，并随时查看我们的 GitHub issues，大展身手，向我们展示您的才能。

在开始贡献之前，请确保您已阅读并接受我们的[贡献者许可协议](https://github.com/toeverything/affine/edit/canary/.github/CLA.md)。要表示同意，只需编辑此文件并提交拉取请求即可。

对于错误报告、功能请求和其他建议，您也可以[创建新的 issue](https://github.com/toeverything/AFFiNE/issues/new/choose) 并选择最合适的模板来提供反馈。

关于翻译和语言支持，您可以访问我们的 [i18n 通用空间](https://community.affine.pro/c/i18n-general)。

寻找其他贡献方式并不知从何开始？查看 [ReflyAI 大使计划](https://community.affine.pro/c/start-here/affine-ambassador)，我们与热情的社区成员密切合作，并为他们提供广泛的支持和资源。

如果您有任何问题，欢迎与我们联系。获取更多信息和学习的最佳场所之一是 [ReflyAI 社区](https://community.affine.pro/home)，您可以在那里与其他志同道合的人交流。

### 贡献者

暂不需要...

## 社区和联系

- [GitHub Discussion](https://github.com/refly-ai/refly/discussions)：最适合分享反馈和提出问题。
- [GitHub Issues](https://github.com/refly-ai/refly/issues)：最适合报告使用 ReflyAI 时遇到的 bug 和提出功能建议。请参阅我们的贡献指南。
- [Discord](https://discord.gg/bWjffrb89h)：最适合分享您的应用程序并与社区互动。
- [Twitter](https://x.com/reflyai)：最适合分享您的应用程序并与社区保持联系。

## Star 历史

暂不需要...

## Upstreams

我们还要感谢以下使 ReflyAI 成为可能的开源项目：

1. Blocksuite - 💠 ReflyAI 背后的开源协作编辑器项目。
2. OctoBase - 🐙 ReflyAI 背后的开源数据库，本地优先 yet 协作。用 Rust 编写的轻量级、可扩展的数据引擎。
3. yjs - 为我们的状态管理和数据同步实现提供 CRDTs 的基础支持。
4. electron - 使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用。
5. React - 用于 Web 和原生用户界面的库。
6. napi-rs - 通过 Node-API 用 Rust 构建编译的 Node.js 插件的框架。
7. Jotai - React 的原始且灵活的状态管理。
8. async-call-rpc - 轻量级 JSON RPC 客户端和服务器。
9. Vite - 下一代前端工具。
10. 其他上游依赖。

非常感谢社区提供如此强大而简单的库，使我们能够更专注于产品逻辑的实现。我们希望将来我们的项目也能为大家提供更易用的知识库。

## 致谢

"我们塑造工具，而后工具塑造我们"。在我们的发展过程中，许多先驱者给予了我们启发，例如：

- Quip 和 Notion 的"一切皆为块"的伟大理念
- Trello 的看板系统
- Airtable 和 Miro 的无代码可编程数据表
- Miro 和 Whimsical 的无边界可视化白板
- Remote 和 Capacities 的基于对象的标签系统

这些应用程序之间的原子"构建块"有很大的重叠。它们不是开源的，也没有像 VSCode 那样的插件系统供贡献者自定义。我们希望创造一个包含我们喜爱的所有功能，并更进一步的工具。

感谢您关注 ReflyAI，我们真诚地希望 ReflyAI 能引起您的共鸣！🎵 请访问 https://refly.ai/ 了解更多详情。

## 安全问题

为保护您的隐私，请避免在 GitHub 上发布安全相关问题。相反，请将您的问题发送至 [support@refly.ai](mailto:support@refly.ai)，我们将为您提供更详细的答复。

## 协议

本代码库采用 [ReflyAI 开源许可证](https://github.com/langgenius/dify/blob/main/LICENSE)，该许可证本质上是 Apache 2.0 许可证加上一些额外限制。
