# ElseID 项目重构报告：从“漂流瓶”到“数字流浪系统”

本报告记录了 ElseID 项目从匿名消息分发（漂流瓶）到人格化身份流浪（数字分身流浪系统）的完整逻辑重构。

## 1. 核心隐喻映射 (Mapping)

| 维度 | 旧逻辑 (Drift Bottle) | 新隐喻 (ElseID) | 底层实现 (Implementation) |
| :--- | :--- | :--- | :--- |
| **发送单元** | 一条消息 (Kind 7777) | 一个数字分身 (Kind 7777 + `type:drifter`) | 从纯文本内容转变为包含 `name`, `personality` 的结构化身份。 |
| **发送频率** | 无限制，阅后即焚 | 同时只有一个分身在外 (稀缺性) | 在 `identities` 表中增加 `active_drifter_id` 约束，创建前检查唯一性。 |
| **身份建模** | 匿名等级 (full/ephemeral/persistent) | 唯一分身 (人格化) | 废弃多身份等级，统一使用本地生成的单主身份，通过 `analyzePersonality` 提取性格。 |
| **地理逻辑** | 仅记录发送位置 (coarse location) | 地理邻近接待 (流浪感) | 重构 `Relay Selector`，根据用户当前地理位置匹配最接近的中继站。 |
| **互动方式** | 文本回复 (`reply_bottle`) | 投喂故事/声音/经验 (`feed_drifter`) | 新增 `feed_type` 标签，区分不同的互动类型，并记录在 `feedings` 表中。 |
| **生命周期** | TTL 自动过期 / 召回消息 | 永恒流浪 / 放弃分身 (重生) | 移除 TTL 限制。`abandon_drifter` 通过 NIP-09 删除云端事件，并本地更新状态。 |
| **历史追踪** | 无 (无状态) | 流浪记录 (`get_journey_log`) | `hosting_log` 用于同步分身的流浪轨迹，`feedings` 记录本地互动历史。 |

## 2. 数据库变更说明

- **`drifters`**: 存储本地创建的分身档案，包括私钥、性格、出发中继等。
- **`feedings`**: 存储“我接待过的流浪者”记录（即我的投喂记录），用于确保一次只接待一人且不重复接待。
- **`hosting_log`**: 存储“我的流浪记录”，即我的分身在外面被他人投喂/招待的记录。
- **`identities`**: 字段 `level` 移除，新增 `active_drifter_id`。

## 3. 工具链升级 (Tools)

- `create_drifter`: ElseID 管家引导用户描述性格与人生目标，自动生成离岸寄语。
- `find_nearby_drifter`: 扫描附近路过的信号，获取对方的人格标签与心声。
- `feed_drifter`: 温暖投喂（声音/故事/经验），将记忆写入对方的 Journey Log。
- `abandon_drifter`: 重生仪式，永久抹除当前记录并旋转身份。
- `get_journey_log`: 实时同步分身在外的被投喂情况，构建完整时间线。

## 4. 移除与优化的组件

- **移除**: `analyzeEmotion` (改为性格分析), `detectLanguage` (不再作为筛选核心), `matcher.ts` (改为地理匹配)。
- **保留**: `secp256k1` 本地签名、位置模糊化（隐私保护）、NIP-09 协议兼容性。

---
**重构完成时间**: 2026-05-12
**版本号**: v0.2.0 (ElseID Edition)
