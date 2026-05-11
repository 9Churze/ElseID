// ============================================================
// Bicean — scripts/send-hello.ts
// 模拟 send_bottle 工具调用测试
// ============================================================

import { initDb } from "../src/storage/db.js";
import { checkContent } from "../src/ai/moderator.js";
import { analyzeEmotion } from "../src/ai/emotion.js";
import { detectLanguage } from "../src/ai/language.js";
import { getFuzzyLocation } from "../src/location/geo.js";
import { getSessionIdentity } from "../src/storage/identity.js";
import { buildDriftEvent }     from "../src/nostr/event_builder.js";
import { signEvent }           from "../src/nostr/event_signer.js";
import { pickRelay }           from "../src/relay/selector.js";
import { broadcast }           from "../src/relay/broadcaster.js";
import { saveBottle }          from "../src/storage/bottles.js";

async function main() {
  console.log("🌊 准备投掷 'Hello World' 漂流瓶...");

  await initDb();

  const content = "Hello World! This is my first Bicean drift bottle.";

  // 1. 审核 (Mocked SDK will return passed)
  console.log("> 执行内容审核...");
  const mod = await checkContent(content);
  console.log(`  结果: ${mod.passed ? "通过" : "拦截"}`);

  // 2. 状态富化
  console.log("> 提取情感与位置...");
  const [emotion, lang, location] = await Promise.all([
    analyzeEmotion(content),
    detectLanguage(content),
    getFuzzyLocation(),
  ]);

  // 3. 生成身份
  const identity = getSessionIdentity("ephemeral");
  console.log(`> 使用会话身份: ${identity.pubkey.slice(0, 8)}...`);

  // 4. 构建并签名
  const unsigned = buildDriftEvent({
    input: { content, lang },
    pubkey: identity.pubkey,
    location,
    emotion
  });
  const signed = signEvent(unsigned, identity.privkey);
  console.log(`> 信号签名完成 ID: ${signed.id.slice(0, 16)}...`);

  // 5. 广播
  const relayUrl = pickRelay();
  console.log(`> 尝试投递至中继站: ${relayUrl}`);
  
  const result = await broadcast(signed, relayUrl);
  
  if (result.success) {
    console.log("✅ 投递成功！");
    saveBottle(signed, relayUrl);
  } else {
    console.log(`❌ 投递失败 (预期内): ${result.message}`);
    console.log("> 正在将信号存入本地‘瓶架’以备后续重试...");
    saveBottle(signed, relayUrl); // 即使网络失败，我们也存入本地库模拟
  }

  console.log("\n[ 本地快照 ]");
  console.log(`- 内容: "${content}"`);
  console.log(`- 情感: ${emotion.mood} (${emotion.tone})`);
  console.log(`- 位置: ${location.city}, ${location.country}`);
}

main().catch(console.error);
