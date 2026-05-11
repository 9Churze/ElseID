# Bicean 🌊

> 基于 Nostr Relay 网络的去中心化 AI 漂流瓶系统  
> Decentralized AI drift bottle system over the Nostr relay network.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Compliance](https://img.shields.io/badge/Compliance-Required-orange.svg)](./COMPLIANCE.md)

---

## 简介

Bicean 是一个基于 Nostr Relay 网络的去中心化 AI 漂流瓶系统。用户通过 MCP 工具向全球发送匿名漂流瓶，并随机捞取来自世界各地的漂流内容。

系统无中心化业务服务器，仅依赖开放 Relay 网络传播消息。

---

## ⚠️ 重要声明 / Important Notice

**本项目以 AGPL-3.0 协议开源。**

> 本系统内置 AI 内容审核模块，用于拦截违法、有害内容。  
> **任何 fork、修改或衍生版本必须保留内容审核机制，并自行承担因修改审核逻辑而产生的一切法律责任。**  
> 本项目原作者对第三方修改版本的内容及其法律后果不承担任何责任。

**This project is licensed under AGPL-3.0.**

> This system includes a built-in AI content moderation module to filter illegal and harmful content.  
> **Any fork, modification, or derivative work must retain the content moderation mechanism. All legal liability arising from modifications to the moderation logic rests solely with the modifier.**  
> The original authors bear no responsibility for the content or legal consequences of third-party modified versions.

📄 详见 / See full policy: [COMPLIANCE.md](./COMPLIANCE.md)

---

## 快速开始

```bash
npm install
npm run dev
```

### 环境变量

```bash
# 必填：用于 AI 内容审核和情绪识别
ANTHROPIC_API_KEY=your_api_key_here
```

---

## MCP Tools

| Tool | 说明 |
|------|------|
| `send_bottle` | 发送漂流瓶到 Nostr Relay |
| `fetch_bottle` | 随机捞取漂流瓶 |
| `reply_bottle` | 匿名回复漂流瓶 |
| `delete_bottle` | 召回你发送的漂流瓶（NIP-09）|
| `list_relays` | 列出所有 Relay 状态 |
| `check_relay_status` | 检测指定 Relay |
| `pick_relay` | 系统自动选择最优 Relay |
| `refresh_relays` | 刷新所有 Relay 健康状态 |

---

## 协议

- Event kind: `7777`
- 单播策略：每个漂流瓶只广播至一个 Relay
- 位置信息：城市级别，精度截断至 1 位小数
- 身份：基于 secp256k1 公私钥，无需注册
- 删除：NIP-09 kind:5 召回请求

---

## 内容审核

发送前系统自动执行 AI 审核，拦截：

- 广告 / 垃圾信息
- 色情 / 暴力内容
- 骚扰 / 仇恨言论
- 联系方式 / 恶意链接
- 欺诈 / 诈骗内容

审核模块位于 `src/ai/moderator.ts`。

> 修改审核逻辑的开发者须自行承担相应法律责任，详见 [COMPLIANCE.md](./COMPLIANCE.md)。

---

## 匿名等级

| 等级 | 说明 | 密钥存储 |
|------|------|----------|
| `full` | 每次发送生成新密钥 | ❌ 不保存 |
| `ephemeral` | 会话内复用同一密钥 | ✅ 会话级 |
| `persistent` | 跨会话固定身份 | ✅ 长期保存 |

> 注意：`full` 模式发送的漂流瓶无法通过 NIP-09 从 Relay 召回（密钥一次性不保存），但可从本地隐藏。

---

## 目录结构

```
bicean/
├── src/
│   ├── tools/          # MCP Tool 定义
│   ├── nostr/          # Nostr 协议层
│   ├── ai/             # AI 审核 & 情绪识别
│   ├── crypto/         # 密钥管理 & 加密
│   ├── relay/          # Relay 健康检测 & 广播
│   ├── storage/        # 本地 SQLite 存储
│   └── location/       # 地理位置模糊化
├── config/             # Relay 列表配置
├── types/              # TypeScript 类型定义
├── tests/              # 单元测试
└── docs/               # 协议文档 & 架构说明
```

---

## 文档

- [架构设计](docs/architecture.md)
- [Event Schema](docs/event_schema.md)
- [合规政策](COMPLIANCE.md)

---

## License

[AGPL-3.0](./LICENSE) © Bicean Contributors

依据 AGPL-3.0，任何在网络上提供本软件服务的衍生版本，**必须**以相同协议开源其完整源代码。
