# Bicean — Nostr Event Schema (kind: 7777)

## 完整 Event 结构

```json
{
  "id": "<sha256 of serialized event>",
  "pubkey": "<sender ephemeral pubkey>",
  "created_at": 1714000000,
  "kind": 7777,
  "tags": [
    ["type", "drift"],
    ["mood", "lonely"],
    ["tone", "melancholic"],
    ["lang", "zh"],
    ["ttl", "86400"],
    ["t", "night"],
    ["t", "japan"],
    ["country", "JP"],
    ["city", "Tokyo"],
    ["lat", "35.6"],
    ["lon", "139.6"]
  ],
  "content": "深夜的东京，路灯像海底的浮标。",
  "sig": "<schnorr signature>"
}
```

## Tags 说明

| Tag       | 值示例         | 必填 | 说明 |
|-----------|----------------|------|------|
| `type`    | `drift`        | ✅   | 标识漂流瓶协议 |
| `mood`    | `lonely`       | 推荐 | AI 情绪识别结果 |
| `tone`    | `melancholic`  | 可选 | 情感色调 |
| `lang`    | `zh`           | 推荐 | ISO 639-1 语言码 |
| `ttl`     | `86400`        | 推荐 | 秒数；0 = 永久 |
| `t`       | `night`        | 可选 | 用户标签（可多个）|
| `country` | `JP`           | 可选 | ISO 3166-1 alpha-2 |
| `city`    | `Tokyo`        | 可选 | 城市名（不精确）|
| `lat`     | `35.6`         | 可选 | 纬度，截断至 1 位小数 |
| `lon`     | `139.6`        | 可选 | 经度，截断至 1 位小数 |

## 回复 Event

回复漂流瓶时，额外携带 `e` tag 关联原瓶：

```json
{
  "kind": 7777,
  "tags": [
    ["type", "drift-reply"],
    ["e", "<original_event_id>"],
    ["mood", "hopeful"],
    ["lang", "zh"]
  ],
  "content": "你不孤单，有人收到了。"
}
```

## 加密 Event（阅后即焚）

content 字段使用 NIP-04 规范加密，解密密钥短期有效：

```json
{
  "kind": 7777,
  "tags": [
    ["type", "drift"],
    ["encrypted", "true"],
    ["ttl", "3600"]
  ],
  "content": "<NIP-04 encrypted ciphertext>"
}
```
