// ============================================================
// Bicean — tests/integration_test.ts
// 集成测试脚本：模拟 MCP 调用全流程
// ============================================================

import { getSessionIdentity } from "../src/storage/identity";
import { initDb }             from "../src/storage/db";
import { broadcast }          from "../src/relay/broadcaster";
import { buildDriftEvent, buildReplyEvent } from "../src/nostr/event_builder";
import { signEvent }          from "../src/nostr/event_signer";
import { subscribeMany }      from "../src/nostr/ws_pool";
import { rankBottles }        from "../src/ai/matcher";
import { saveBottle }         from "../src/storage/bottles";
import { DEFAULT_RELAYS }     from "../config/relays";

async function runTest() {
  console.log("🧪 开始 Bicean 全流程集成测试...");
  
  // 0. 初始化数据库
  initDb();
  console.log("✅ 数据库初始化完成");

  // 1. 模拟发送 (send_bottle)
  console.log("\n[步骤 1] 模拟发送漂流瓶...");
  const identity = getSessionIdentity("persistent");
  const testContent = `Integration Test Signal - ${new Date().toISOString()}`;
  
  const driftEvent = buildDriftEvent({
    input: {
      content: testContent,
      mood: "hopeful",
      lang: "en",
      tags: ["test", "integration"],
      anonymity: "persistent"
    } as any,
    pubkey: identity.pubkey,
    location: { country: "XX", city: "Test-City", lat: "31.2", lon: "121.5" },
    emotion: { mood: "hopeful", tone: "testing", tags: ["test"], confidence: 1 }
  });

  const signedDrift = signEvent(driftEvent, identity.privkey);
  const sendResult = await broadcast(signedDrift, DEFAULT_RELAYS[0].url);
  
  if (sendResult.success) {
    console.log(`✅ 发送成功！中继站已接收。ID: ${signedDrift.id.slice(0, 10)}...`);
    saveBottle(signedDrift, DEFAULT_RELAYS[0].url);
  } else {
    console.error(`❌ 发送失败: ${sendResult.message}`);
  }

  // 2. 模拟打捞 (fetch_bottle)
  console.log("\n[步骤 2] 模拟全球打捞...");
  const filter = { kinds: [7777], limit: 10 };
  const relayUrls = DEFAULT_RELAYS.map(r => r.url);
  const fetchedItems = await subscribeMany(relayUrls, filter as any);
  
  console.log(`✅ 打捞完成，共发现 ${fetchedItems.length} 条信号`);
  const ranked = rankBottles(fetchedItems, { mood: "hopeful" });
  const target = ranked[0];

  if (target) {
    console.log(`🎯 匹配到最契合信号: "${target.event.content.slice(0, 30)}..." 来自 ${target.relay}`);
    
    // 3. 模拟回复 (reply_bottle)
    console.log("\n[步骤 3] 模拟回复信号...");
    const replyEvent = buildReplyEvent({
      content: "Hello from integration test!",
      pubkey: identity.pubkey,
      originalEventId: target.event.id,
      mood: "happy",
      lang: "en"
    });

    const signedReply = signEvent(replyEvent, identity.privkey);
    const replyResult = await broadcast(signedReply, target.relay);

    if (replyResult.success) {
      console.log("✅ 回复成功！信件已通过回溯链路投递。");
    } else {
      console.error(`❌ 回复失败: ${replyResult.message}`);
    }
  }

  console.log("\n🎉 所有测试步骤执行完毕。");
  process.exit(0);
}

runTest().catch(err => {
  console.error("💥 测试崩溃:", err);
  process.exit(1);
});
