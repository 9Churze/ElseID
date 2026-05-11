# Bicean MCP Server — 运行测试报告 (2026-05-11)

## 1. 测试综述
测试旨在验证 Bicean MCP Server 的核心逻辑链路是否能够在本地环境正常运行。

**测试环境**:
- **OS**: macOS
- **Node**: v24.13.0
- **Storage**: SQLite 3 (WAL mode)
- **Status**: **本地逻辑通路已验证 (Verified)** | **网络链路受限 (Restricted)**

---

## 2. 核心模块验证状态

| 模块 | 测试项 | 结果 | 备注 |
|------|--------|------|------|
| **Storage** | 数据库初始化 (`initDb`) | ✅ PASS | 成功创建 `.bicean_data/bicean.db` 及所有表 |
| **Relay** | 健康检测 (`checkAllRelays`) | ✅ PASS | 逻辑正确运行，成功检测并记录中继状态 |
| **Relay** | 缓存机制 (`persist`) | ✅ PASS | 检测结果已持久化至 `relay_stats` 表 |
| **Nostr** | 身份生成 (`Identity`) | ✅ PASS | 成功生成 secp256k1 密钥对 |
| **Network** | 中继站连通性 | ❌ FAIL | 当前运行环境禁止外网连接，无法实际连接 Nostr 网络 |
| **Dependencies**| 依赖完整性 | ⚠️ WARN | 缺少 `ws` 包，已通过从相邻项目手动补齐解决 |

---

## 3. 补充审计发现 (集成运行期观察)

基于实际运行测试，对之前的审计文档进行以下补充：

### [H6] 权限敏感路径问题 (High)
- **描述**: `src/storage/db.ts` 硬编码使用 `os.homedir()`。在某些沙箱环境（如 MCP 运行环境）中，可能没有权限在用户家目录创建 `.bicean` 文件夹。
- **影响**: 服务启动失败。
- **建议**: 增加环境变量支持（如 `BICEAN_DATA_DIR`），或优先尝试在当前工作目录创建存储。

### [H7] `ws` 依赖丢失 (High)
- **描述**: `package.json` 中声明了 `ws`，但部分安装环境可能缺失。
- **影响**: 核心中继功能无法加载。
- **建议**: 验证 `package-lock.json` 的完整性，确保部署脚本执行了完整的 `npm install`。

---

## 4. 修复后的架构建议

为了确保 Bicean 在各种 MCP 环境下都能"开箱即用"，建议：
1. **自动路径适配**: 使用类似 `path.resolve(process.env.BICEAN_DATA_DIR || './data')` 的逻辑。
2. **启动自检**: 在 MCP `initialize` 阶段完成第一次中继健康扫描。
3. **内置代理支持**: 考虑到 Nostr 中继在全球范围内的可达性，增加 `HTTPS_PROXY` 支持。

---

## 5. 本次测试生成的文件
- `scripts/test-relay.ts`: 独立连通性验证脚本（已验证逻辑）。
- `.bicean_data/`: 本地测试数据库目录。
- `src/storage/db.ts`: 已打补丁（将存储路径修改为本地以绕过权限限制）。

---
*注：由于环境离线，AI 内容审核功能（Claude API）目前处于 "fail-open" 模式，即默认通过。*
