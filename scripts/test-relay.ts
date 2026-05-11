// ============================================================
// Bicean — scripts/test-relay.ts
// 独立中继连通性测试脚本（不依赖 Claude API）
// 用途：验证 relay 层是否能正常建连、健康检测、选择
// 运行方式：node --import tsx/esm scripts/test-relay.ts
// ============================================================

import { checkAllRelays, getCachedRelayInfo } from "../src/relay/health.js";
import { pickRelay, pickRelaysForFetch }       from "../src/relay/selector.js";
import { initDb }                              from "../src/storage/db.js";
import { DEFAULT_RELAYS }                      from "../config/relays.js";

// ── ANSI 颜色 ────────────────────────────────────────────────
const G = (s: string) => `\x1b[32m${s}\x1b[0m`;  // green
const R = (s: string) => `\x1b[31m${s}\x1b[0m`;  // red
const Y = (s: string) => `\x1b[33m${s}\x1b[0m`;  // yellow
const B = (s: string) => `\x1b[36m${s}\x1b[0m`;  // cyan
const D = (s: string) => `\x1b[2m${s}\x1b[0m`;   // dim

function hr() { console.log(D("─".repeat(60))); }

async function main() {
  console.log("\n" + B("╔══════════════════════════════════════════════╗"));
  console.log(B("║        Bicean Relay Connectivity Test        ║"));
  console.log(B("╚══════════════════════════════════════════════╝\n"));

  // ── Step 1: 初始化 DB ──────────────────────────────────────
  console.log(Y("[1/4] 初始化本地数据库..."));
  try {
    await initDb();
    console.log(G("  ✓ SQLite 数据库初始化成功 (~/.bicean/bicean.db)\n"));
  } catch (e: any) {
    console.error(R(`  ✗ DB 初始化失败: ${e.message}`));
    process.exit(1);
  }

  // ── Step 2: 检测所有中继 ──────────────────────────────────
  hr();
  console.log(Y(`[2/4] 正在检测 ${DEFAULT_RELAYS.length} 个中继站 (超时 5s/个)...`));
  console.log(D("  这可能需要 10-20 秒，请耐心等待...\n"));

  const start = Date.now();
  const results = await checkAllRelays();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const online   = results.filter(r => r.online);
  const offline  = results.filter(r => !r.online);
  const writable = online.filter(r => r.writable);

  console.log(`\n  ${G(`✓ ${online.length} 在线`)}  /  ${R(`✗ ${offline.length} 离线`)}  /  ` +
              `${G(`✍ ${writable.length} 可写`)}  [耗时 ${elapsed}s]\n`);

  hr();
  console.log(Y("[2/4] 中继详情:\n"));

  for (const r of results) {
    const status  = r.online  ? G("● ONLINE ") : R("● OFFLINE");
    const write   = r.writable ? G("✍ writable") : D("  readonly");
    const latency = r.latencyMs !== null
      ? (r.latencyMs < 200 ? G(`${r.latencyMs}ms`) : Y(`${r.latencyMs}ms`))
      : D("  —  ");
    const url = D(r.url.replace("wss://", ""));
    console.log(`  ${status}  ${write}  ${latency.padEnd(10)}  ${url}`);
  }

  // ── Step 3: 中继选择算法验证 ─────────────────────────────
  hr();
  console.log(Y("\n[3/4] 验证中继选择算法...\n"));

  if (writable.length === 0) {
    console.log(R("  ✗ 无可写中继！选择算法测试跳过。"));
  } else {
    // 运行 20 次，统计分布
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const url = pickRelay();
      counts[url] = (counts[url] ?? 0) + 1;
    }

    console.log("  pick_relay (20次分布):");
    for (const [url, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      const bar = "█".repeat(count);
      console.log(`    ${bar.padEnd(22)} ${count.toString().padStart(2)}次  ${D(url.replace("wss://", ""))}`);
    }

    const fetchRelays = pickRelaysForFetch(3);
    console.log(`\n  pick_relays_for_fetch(3): ${fetchRelays.map(u => D(u.replace("wss://", ""))).join(", ")}`);
    console.log(G("\n  ✓ 选择算法正常\n"));
  }

  // ── Step 4: DB 缓存验证 ───────────────────────────────────
  hr();
  console.log(Y("[4/4] 验证 relay_stats 缓存...\n"));

  const cached = getCachedRelayInfo();
  console.log(`  relay_stats 表共 ${cached.length} 条记录`);
  if (cached.length === results.length) {
    console.log(G("  ✓ 缓存写入完整\n"));
  } else {
    console.log(Y(`  ⚠ 预期 ${results.length} 条，实际 ${cached.length} 条\n`));
  }

  // ── 最终摘要 ─────────────────────────────────────────────
  hr();
  if (online.length > 0 && writable.length > 0) {
    console.log(G(`\n✅ PASS  中继层连通性正常：${writable.length}/${DEFAULT_RELAYS.length} 个中继可写`));
    console.log(G(`   系统可以发送漂流瓶。\n`));
  } else if (online.length > 0) {
    console.log(Y(`\n⚠️  WARN  有 ${online.length} 个中继在线但不可写`));
    console.log(Y(`   fetch_bottle 可能正常，send_bottle 可能失败。\n`));
  } else {
    console.log(R(`\n❌ FAIL  所有中继均不可达`));
    console.log(R(`   请检查网络连接（是否需要代理？）\n`));
  }
}

main().catch((err) => {
  console.error(R(`\n致命错误: ${err.message}`));
  process.exit(1);
});
