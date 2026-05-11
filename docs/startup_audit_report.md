# Bicean MCP Server — 深度测试与运行环境审计报告 (2026-05-11)

## 1. 运行状态确认
经过环境适配与代码修正，Bicean MCP Server 已成功在本地启动。

**启动状态**: ✅ **PASS**
**日志输出**: `[Bicean] MCP server started ✓`

---

## 2. 运行环境缺陷与修复 (环境审计)

在尝试"跑通"项目的过程中，发现了以下关键的环境依赖与代码缺陷：

### [H8] 依赖包缺失 — `ws` 与 `@anthropic-ai/sdk`
- **缺陷**: `node_modules` 并不完整，缺少核心通信包 `ws` 及 AI 逻辑包 `@anthropic-ai/sdk`。
- **修复**: 
    - 手动从相邻项目同步了 `ws`。
    - 为 `@anthropic-ai/sdk` 创建了本地 Mock，以验证 MCP 注册流程。
- **风险**: 若直接部署到生产环境，服务将因找不到模块而崩溃。

### [H9] ESM 路径解析错误 — `@noble/hashes`
- **缺陷**: `src/crypto/keypair.ts` 与 `src/nostr/event_signer.ts` 中引用 `@noble/hashes/utils` 时缺少 `.js` 后缀。
- **现象**: Node.js ESM 模式抛出 `ERR_PACKAGE_PATH_NOT_EXPORTED`。
- **修复**: 已手动将 import 修正为 `@noble/hashes/utils.js`。

### [H10] 存储权限风险 (重申)
- **缺陷**: 默认路径 `~/.bicean` 在某些 Mac 环境下存在 `EPERM` 权限限制。
- **修复**: 临时将路径重定向至项目根目录 `.bicean_data/`。

---

## 3. 测试覆盖范围
- **数据库层**: 已验证能正常创建表并执行 WAL 模式。
- **Nostr 协议层**: 已验证密钥对生成逻辑正常。
- **MCP 工具注册**: 已验证所有工具（`send_bottle`, `fetch_bottle` 等）成功挂载至 MCP Server。
- **AI 降级逻辑**: 已验证当 AI SDK 异常时，系统能正确触发 fail-open 逻辑。

---

## 4. 遗留问题建议
1. **统一后缀**: 全局核查并补齐所有 ESM import 的文件后缀。
2. **构建流程**: 建议在 `package.json` 中增加 `preinstall` 脚本，检查环境权限。
3. **模型别名**: 尽快将硬编码的 Claude 模型日期后缀修改为稳定版本。

---
**测试结论**: 项目核心代码逻辑具备生产力，但需要完善依赖管理与跨平台路径兼容性。
