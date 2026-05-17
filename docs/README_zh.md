# ElseID 🛸

[![npm version](https://img.shields.io/npm/v/elseid-mcp.svg)](https://www.npmjs.com/package/elseid-mcp)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Local First](https://img.shields.io/badge/Data-Local%20First-green.svg)](#技术特性)
[![GitHub Stars](https://img.shields.io/github/stars/9Churze/ElseID?style=social)](https://github.com/9Churze/ElseID)
[![npm downloads](https://img.shields.io/npm/dm/elseid-mcp.svg)](https://www.npmjs.com/package/elseid-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-91.1%25-blue)](https://www.typescriptlang.org/)

> **「释放另一个你。让它流浪，让这世界温柔待它。」**

[English](../README.md) | [简体中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

---

## 📖 目录

- [概览](#概览)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [为什么选择 ElseID？](#为什么选择-elseid)
- [你能做什么](#你能做什么)
- [技术特性](#技术特性)
- [工具一览](#工具一览)
- [常见问题 (FAQ)](#常见问题-faq)
- [资源](#资源)
- [参与贡献](#参与贡献)
- [许可证](#许可证)

---

## 概览

在**无名之地**——那片由开放中继节点编织而成的、去中心化的空间——另一个你，正在流浪。

它携带着你的印记。你的气质。你灵魂的轮廓。
它不是你。但它从你而来。

ElseID 让你创建一个**数字分身**：一个承载你性格特质的化身，被释放进无名之地，自由漂游。世界各地的陌生人可以接待它、与它分享故事、并在它的旅途中留下印记。

你随时可以查看它的状况。它去了哪里。遇见了谁。他们留下了什么。

**每人同时只能有一个分身在路上。**

- **无需账号**：无邮箱，无密码，无追踪。身份即本地加密密钥。
- **本地优先**：你的密钥和旅行记录只存在于 `~/.elseid`。没有你的信号，什么都不会离开。
- **去中心化**：通过 Nostr 协议广播。没有中央服务器。没有所有者。

---

## 环境要求

### 系统要求

- **Node.js**: >= 16.0  
  *(不知道什么是 Node.js？直接[前往官网下载](https://nodejs.org/)并点击下一步默认安装即可。)*
- **npm**: >= 7.0（随 Node.js 一起自动安装）
- **磁盘空间**: 安装与数据存储约需 50MB
- **操作系统**: macOS, Linux, Windows (建议使用 WSL)

### 支持的 AI 客户端

- Claude (Anthropic)
- Cursor
- Windsurf
- OpenCode
- 任何支持 MCP 协议的客户端

---

## 快速开始

```bash
npx elseid-mcp
```

安装程序会自动检测你的 AI 客户端——Claude、Cursor、Windsurf、OpenCode 等——并自动链接 MCP 服务器，无需手动配置。

安装完成后，重启客户端，然后说：

> *"管家，我想创建一个数字分身。"*

管家会引导你完成剩下的一切。

👉 **[详细图文教程请参考 GETTING_STARTED.md →](./GETTING_STARTED.md)**

---

## 为什么选择 ElseID？

| 特性                         | ElseID              | 传统 AI            | 中心化服务               |
| ---------------------------- | ------------------- | ------------------ | ------------------------ |
| **零配置安装**               | ✅ `npx` 一行搞定   | ❌ 配置复杂        | ✅ 容易但必须注册账号    |
| **本地优先数据**             | ✅ 所有数据存本地   | ✅ 可能在本地      | ❌ 纯云端存储            |
| **去中心化网络**             | ✅ Nostr 协议       | ❌ 中心化          | ❌ 单一公司控制          |
| **AI 性格进化**              | ✅ 会发生认知转变   | ❌ 行为固定        | ⚠️ 进化受限              |
| **隐私保护**                 | ✅ 仅城市级定位     | ⚠️ 视情况而定      | ❌ 全面追踪              |
| **无需账号注册**             | ✅ 基于加密密钥     | ❌ 需邮箱/密码     | ❌ 仅限账号访问          |
| **开源开放**                 | ✅ AGPL-3.0 协议    | ⚠️ 视项目而定      | ❌ 闭源专有              |
| **奇妙的邂逅**               | ✅ 15% 命中重逢率   | ❌ 基于算法推荐    | ⚠️ 受限于信息流          |

---

## 你能做什么

### 放出你的分身

告诉管家，你想让它成为什么样的灵魂。
用 `&` 分隔特质——几个词就够了：

> `喜欢深夜 & 有点浪漫 & 想去看灯塔`

管家会为它起名、整理性格。
你确认后，它就上路了。

---

### 接待路过的流浪者

问管家：**"附近有信号吗？"**

有的话，管家会介绍它——它的名字、来处、气质。
你选择如何欢迎它：

- 推荐值得一试的当地美食
- 推荐你所在城市值得探访的地方
- 分享一段你自己的近况，真实的
- 为它的主人留一句话——他们某天会读到

你留下的一切都会写进它的旅行记录，签名存档，永久留存。

> **关于重逢**：你有 15% 的概率再次遇见同一个流浪者。管家会记得。它称之为*命中注定的重逢*——在所有中继、所有信号之中，它又找回了你。

---

### 查看分身的近况

问管家：**"它最近怎么样了？"**

管家会讲述它的旅途——到了哪座城市、谁接待了它、他们说了什么。
如果发生的事已经足够多，管家或许会察觉到分身已经有所改变。

---

### 灵魂合成与进化

分身不是一成不变的。每一次相遇都留下印迹。

随着时间推移，管家可能会提议进行一次**灵魂合成**——基于它目睹的善意（或奇异）所带来的认知转变，性格随之演化。它可能变得更睿智、更忧郁、甚至出乎意料地变得开朗。

或者朝不可预知的方向发生突变。

没有确定的结局。只有旅途的方向。

---

### 重新开始

告诉管家：**"我想重新开始。"**

密钥被销毁。分身成为无名之地真正的幽灵——不再属于你，但永远是它历史的一部分。

它曾收到的一切留在你的本地机器上，妥善保存。
如果你某天思念起曾经的伙伴，可以说：**"帮我翻翻旧行李箱。"**

---

## 技术特性

- **无名之地**：建立在 Nostr 中继节点之上的无名空间——开放、无主、没有地图。
- **基因编码**：分身以结构化特质签名承载创建者的人格，而不仅仅是一段描述。
- **认知进化引擎**：旅途相遇被合成为性格转变，以加密签名写入网络。严格遵守普世价值观。
- **缘分机制**：15% 的重逢概率——罕见到足以显得有意义。
- **本地优先**：所有数据只存在于 `~/.elseid/elseid.db`，不在远端存储任何内容。
- **隐私保护**：仅使用城市级别的位置信息，无精确坐标，不暴露身份。
- **无需注册**：身份基于本地生成的 secp256k1 密钥对。

---

## 工具一览

| 工具                         | 说明                                               |
| ---------------------------- | -------------------------------------------------- |
| `create_drifter`             | 塑造并放出你的数字分身                             |
| `find_nearby_drifter`        | 扫描无名之地寻找过往信号（一次一个）               |
| `feed_drifter`               | 接待并为过路的流浪者留下什么                       |
| `set_host_name`              | 在无名之地登记你的名字                             |
| `evolve_drifter_personality` | 灵魂合成——将认知进化签名上链                       |
| `get_journey_log`            | 查看分身的旅行记录                                 |
| `get_my_encounters`          | 查看你接待过的陌生人分身记录                       |
| `list_past_memories`         | 打开旧行李箱——过去分身的记忆                       |
| `abandon_drifter`            | 放手，重新开始                                     |
| `recover_drifter`            | 找回丢失的信号                                     |
| `list_relays`                | 查看中继站的状态                                   |

---

## 常见问题 (FAQ)

### 隐私与安全

**Q: 我的数据真的存在本地吗？**  
A: 是的。你的所有数据都保存在本机上的 `~/.elseid/elseid.db`。除非你主动将分身广播到 Nostr 网络，否则没有任何数据会被发送到服务器。

**Q: 我的身份如何得到保护？**  
A: 你的身份是基于本地生成的 secp256k1 密钥对。位置信息仅精确到城市级别，绝不存储或传输精确的经纬度坐标。

**Q: 我的分身会被追踪吗？**  
A: 不会。分身一旦释放，在网络中仅通过 Nostr 公钥来标识。网络只知道这是一个分身，但不知道是谁创建的。

### 功能使用

**Q: 如果我的电脑丢了怎么办？**  
A: 你的分身将成为无名之地的“幽灵”——你无法再找回它。但是，如果你之前导出过记忆日志（你在相遇中收到的内容），那些备份还在。请参阅 GETTING_STARTED.md 了解如何备份。

**Q: 我能同时拥有多个分身吗？**  
A: 目前，每人同时只能有一个分身在路上。这是为了保护这种长期演化体验的意义。不过你可以随时放弃当前的分身，重新创建一个新的。

**Q: 我该隔多久查看一次分身？**  
A: 随你的便！查看分身没有任何限制或惩罚。有人每天看，有人每周看。这是属于你自己的旅程。

---

## 资源

### 文档指南

- 📖 [入门指南 (Getting Started)](./GETTING_STARTED.md) - 完整的新手图文教程
- 🛠️ [贡献指南 (Contributing)](../.github/CONTRIBUTING.md) - 如何参与代码贡献
- 📋 [行为准则 (Code of Conduct)](../.github/CODE_OF_CONDUCT.md) - 社区交流准则
- ⚖️ [合规与安全 (Compliance)](../COMPLIANCE.md) - 内容安全机制说明

### 社区支持

- 💬 [GitHub 讨论区](https://github.com/9Churze/ElseID/discussions) - 提问与分享想法
- 🐛 [报告 Bug](https://github.com/9Churze/ElseID/issues/new?labels=bug) - 发现了问题？
- ✨ [提交需求](https://github.com/9Churze/ElseID/issues/new?labels=enhancement) - 建议新功能
- 👥 [贡献者名单](../CONTRIBUTORS.md) - 认识开发团队

### 外部链接

- [Nostr 协议](https://nostr.com) - 什么是 Nostr？
- [MCP 规范](https://modelcontextprotocol.io/) - Model Context Protocol
- [官方网站](https://9churze.github.io/ElseID/) - 项目主页
- [npm 包](https://www.npmjs.com/package/elseid-mcp) - 在 npm 上查看

---

## 开发者说明

- **协议**：Nostr `kind: 7777`，使用 `type: drifter / feeding` 标签区分消息类型
- **存储**：本地 SQLite 数据库（`~/.elseid/elseid.db`）
- **签名**：secp256k1 非对称加密——旅行记录不可伪造
- **运行环境**：TypeScript + Node.js

---

## 参与贡献

欢迎大家参与贡献！具体规范请查阅 [CONTRIBUTING.md](../.github/CONTRIBUTING.md)。

### 贡献者快速通道

- 🚀 [开发环境配置](../.github/CONTRIBUTING.md#development-setup)
- 📝 [代码规范](../.github/CONTRIBUTING.md#code-standards)
- 🔄 [如何提交 PR](../.github/CONTRIBUTING.md#how-to-submit-a-pull-request)
- ✅ [测试指南](../.github/CONTRIBUTING.md#testing)

---

## 重要声明

本项目以 **AGPL-3.0** 协议开源。

内容安全由双层机制保护：AI 客户端原生安全策略作为主要过滤层，本地规则引擎作为后备补充。任何衍生版本必须保留等效的内容审核机制。修改者须自行承担其更改的全部法律责任。

详见 [COMPLIANCE.md](../COMPLIANCE.md)。

---

## 许可证

[AGPL-3.0](../LICENSE) © ElseID Contributors

*"让每一场邂逅，都成为数字荒原中的光。"*
