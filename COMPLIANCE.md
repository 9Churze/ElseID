# Compliance & Content Moderation Policy

> **语言 / Language**: [中文](#中文版) | [English](#english-version)

---

## 中文版

### 一、内容审核机制

ElseID 在客户端内置了基于 Claude AI 的内容审核模块（`src/ai/moderator.ts`），在每条流浪信息发送前自动执行审核。

**默认拦截以下内容：**

- 广告、垃圾信息、推广内容
- 色情或淫秽内容
- 暴力威胁或图形化暴力描述
- 骚扰、仇恨言论、歧视性内容
- 联系方式（电话、邮箱、社交账号、URL）
- 恶意链接、钓鱼内容
- 欺诈或诈骗内容
- 任何试图识别或定位真实个人的内容

**允许发送的内容：**

- 个人情感、感受与思考
- 创意写作、诗歌、虚构故事
- 哲学思考、日常观察
- 任何语言的正常表达

---

### 二、开发者与贡献者责任

本项目以 **AGPL-3.0** 协议开源。

如果你修改、fork 或基于本项目构建衍生版本：

1. **你必须保留内容审核模块**，或实现功能等效的替代审核机制。
2. **你必须在你的版本中同样采用 AGPL-3.0 协议**，并公开源代码。
3. **你须自行承担**因删除、绕过或削弱内容审核而导致的一切法律责任。
4. **你须遵守你的用户所在地区适用的所有法律法规**，包括但不限于网络内容管理、数据隐私保护相关法规。

> ⚠️ **警告**：删除或修改 `src/ai/moderator.ts` 中的审核逻辑，可能导致违法内容通过系统传播，相关法律责任由修改者自行承担，与本项目原作者无关。

---

### 三、用户责任

使用 Bicean（包括任何官方或非官方版本）的用户须知：

- 你对你发送的内容负责。
- 禁止使用本系统传播任何违法内容。
- 禁止利用本系统骚扰、伤害或歧视他人。
- 本系统基于 Nostr 开放网络，内容一旦广播不可完全撤回，请谨慎发送。

---

### 四、免责声明

本项目原作者：

- **不控制**任何第三方 Relay 上的内容。
- **不对**修改版本或 fork 版本中出现的内容问题负责。
- **不对**用户绕过审核机制后的行为负责。
- 保留在发现滥用时**拒绝合并相关 Pull Request** 或将其标记的权利。

---

### 五、举报与联系

如发现本项目官方版本存在合规问题，请通过 GitHub Issues 提交报告，并在标题中注明 `[COMPLIANCE]`。

---

## English Version

### 1. Content Moderation System

Bicean includes a built-in AI-powered content moderation module (`src/ai/moderator.ts`) that automatically reviews every message before it is broadcast to the Nostr network.

**The following content is blocked by default:**

- Advertisements, spam, or promotional material
- Sexual or pornographic content
- Violent threats or graphic violence
- Harassment, hate speech, or discriminatory content
- Contact information (phone numbers, emails, social handles, URLs)
- Malicious links or phishing attempts
- Fraud or scam content
- Any attempt to identify or locate a real individual

**The following content is permitted:**

- Personal reflections, emotions, and thoughts
- Creative writing, poetry, and fiction
- Philosophical musings and daily observations
- Normal expression in any language

---

### 2. Developer & Contributor Responsibilities

This project is licensed under **AGPL-3.0**.

If you modify, fork, or build derivative works from this project:

1. **You must retain the content moderation module**, or implement a functionally equivalent alternative.
2. **Your derivative work must also be licensed under AGPL-3.0** and the source code must be made publicly available.
3. **You are solely responsible** for any legal consequences arising from the removal, bypass, or weakening of content moderation.
4. **You must comply with all applicable laws and regulations** in the jurisdictions of your users, including but not limited to internet content governance and data privacy laws.

> ⚠️ **Warning**: Removing or modifying the moderation logic in `src/ai/moderator.ts` may allow illegal content to propagate through the system. All legal liability for such modifications rests solely with the modifier, not with the original authors of this project.

---

### 3. User Responsibilities

Users of Bicean (including any official or unofficial versions) acknowledge that:

- You are responsible for the content you send.
- Using this system to transmit illegal content is strictly prohibited.
- Using this system to harass, harm, or discriminate against others is strictly prohibited.
- Bicean operates over the open Nostr network. Once broadcast, content cannot be fully recalled. Send with care.

---

### 4. Disclaimer

The original authors of this project:

- **Do not control** content on any third-party Relay.
- **Are not responsible** for content issues in modified or forked versions.
- **Are not responsible** for actions taken by users who circumvent the moderation system.
- Reserve the right to **reject or flag Pull Requests** found to weaken content safety.

---

### 5. Reporting

If you discover a compliance issue in the official version of this project, please open a GitHub Issue with `[COMPLIANCE]` in the title.

---

*Last updated: 2025*
*License: AGPL-3.0 — See [LICENSE](./LICENSE)*
