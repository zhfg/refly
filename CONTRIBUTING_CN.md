# 贡献指南

所以你想为 Refly 做贡献 - 这太棒了，我们迫不及待地想看到你的贡献。作为一个 AI Native 创作引擎，我们致力于提供最直观的自由画布界面，集成了多线程对话、知识库 RAG 集成、上下文记忆和智能搜索等功能。社区的任何帮助都是宝贵的。

考虑到我们的现状，我们需要灵活快速地交付，但我们也希望确保像你这样的贡献者在贡献过程中获得尽可能顺畅的体验。我们为此编写了这份贡献指南，旨在让你熟悉代码库和我们与贡献者的合作方式，以便你能快速进入有趣的部分。

这份指南，就像 Refly 本身一样，是一个不断改进的工作。如果有时它落后于实际项目，我们非常感谢你的理解，并欢迎提供任何反馈以供我们改进。

在许可方面，请花一分钟阅读我们简短的 [许可证和贡献者协议](./LICENSE)。社区还遵守 [行为准则](./.github/CODE_OF_CONDUCT.md)。

## 在开始之前

[查找](https://github.com/refly-ai/refly/issues?q=is:issue+is:open)现有问题，或 [创建](https://github.com/refly-ai/refly/issues/new/choose) 一个新问题。我们将问题分为两类：

### 功能请求：

- 如果您要提出新的功能请求，请解释所提议的功能的目标，并尽可能提供详细的上下文，说明它如何增强 AI Native 创作体验。

- 如果您想从现有问题中选择一个，请在其下方留下评论表示您的意愿。

相关方向的团队成员将参与其中。如果一切顺利，他们将批准您开始编码。在此之前，请不要开始工作，以免我们提出更改导致您的工作付诸东流。

根据所提议的功能所属的领域不同，您可能需要与不同的团队成员交流。以下是我们团队成员目前正在从事的各个领域的概述：

| 团队成员       | 工作范围                      |
| -------------- | ----------------------------- |
| 画布与 AI 功能 | 多线程对话、AI 驱动的画布功能 |
| 知识库         | RAG 集成、上下文记忆          |
| 前端体验       | UI/UX、画布交互               |
| 开发者体验     | API、SDK、开发者工具          |
| 核心架构       | 整体系统设计和可扩展性        |

事项优先级：

| 功能类型               | 优先级     |
| ---------------------- | ---------- |
| 核心 AI 功能和画布功能 | 高优先级   |
| 知识库和协作功能       | 中等优先级 |
| UI/UX 改进和小幅增强   | 低优先级   |
| 实验性功能和未来构想   | 未来功能   |

### 其他任何事情（例如 bug 报告、性能优化、拼写错误更正）：

- 立即开始编码。

  事项优先级：

  | Issue 类型                    | 优先级     |
  | ----------------------------- | ---------- |
  | 核心 AI 功能或画布功能的 Bugs | 紧急       |
  | 影响用户体验的性能问题        | 中等优先级 |
  | 小幅 UI 修复和文档更新        | 低优先级   |

## 安装

以下是设置 Refly 进行开发的步骤：

### 1. Fork 该仓库

### 2. 克隆仓库

从终端克隆代码仓库：

```bash
git clone git@github.com:<github_username>/refly.git
```

### 3. 验证依赖项

Refly 需要以下依赖项：

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js v18.x (LTS)](http://nodejs.org)
- [npm](https://www.npmjs.com/) version 8.x.x 或 [Yarn](https://yarnpkg.com/)
- [Python](https://www.python.org/) version 3.11.x 或 3.12.x

### 4. 安装

Refly 由多个包组成，采用 monorepo 结构管理。主要组件包括：

1. Web 应用 (`apps/web/`)：主要的 Web 界面
2. AI 工作区公共组件 (`packages/ai-workspace-common/`)：共享的 AI 工作区组件
3. i18n (`packages/i18n/`)：国际化支持

按照以下步骤安装：

1. 安装依赖：

```bash
yarn install
```

2. 设置环境变量：

```bash
cp .env.example .env
```

3. 启动开发服务器：

```bash
yarn dev
```

## 开发

为了帮助您快速了解您的贡献在哪个部分，以下是 Refly 的结构概述：

### 后端结构

```text
[apps/server/]             // 主服务器应用
├── src/
│   ├── controllers/      // API 路由处理器
│   ├── services/        // 业务逻辑实现
│   ├── models/          // 数据模型和类型
│   ├── ai/              // AI 功能实现
│   │   ├── llm/        // LLM 集成和管理
│   │   ├── rag/        // RAG 流程实现
│   │   └── memory/     // 上下文记忆管理
│   ├── canvas/         // 画布相关的后端服务
│   └── utils/          // 共享工具函数

[packages/]
├── ai-core/            // 核心 AI 功能
│   ├── src/
│   │   ├── llm/       // LLM 抽象和实现
│   │   ├── memory/    // 记忆系统
│   │   └── rag/       // RAG 实现
│
└── shared/            // 共享类型和工具
    └── src/
        └── types/     // 通用 TypeScript 类型
```

后端使用 Node.js 和 TypeScript 构建，主要关注：

- AI 功能实现，包括 LLM 集成、RAG 流程和上下文记忆
- 画布状态管理和实时协作
- RESTful API 和 WebSocket 连接以支持实时功能
- 知识库的高效数据存储和检索

### 前端结构

```text
[apps/web/]                 // 主要 Web 应用
├── src/
│   ├── components/         // React 组件
│   ├── styles/            // 全局样式和主题
│   └── main.tsx           // 应用入口点

[packages/]
├── ai-workspace-common/   // 共享 AI 工作区组件
│   ├── src/
│   │   ├── components/    // 画布、编辑器和 AI 功能组件
│   │   └── utils/        // 共享工具函数
│
└── i18n/                 // 国际化
    ├── src/
    │   ├── en-US/        // 英文翻译
    │   └── zh-Hans/      // 中文翻译
```

## 提交你的 PR

当你准备提交贡献时：

1. 确保你的代码遵循我们的代码风格指南
2. 如果适用，添加测试
3. 如果需要，更新文档
4. 创建一个指向 `main` 分支的拉取请求

对于重要的功能，我们首先将它们合并到 `develop` 分支进行测试，然后再合并到 `main` 分支。

就是这样！一旦你的 PR 被合并，你将成为我们 [README](https://github.com/refly-ai/refly/blob/main/README.md) 中的贡献者。

## 获取帮助

如果你在贡献过程中遇到困难或有任何问题，你可以：

- 加入我们的 [Discord](https://discord.gg/bWjffrb89h) 社区
- 在我们的 [GitHub Discussions](https://github.com/refly-ai/refly/discussions) 中开启讨论
- 查看我们的[文档](https://docs.refly.ai)
