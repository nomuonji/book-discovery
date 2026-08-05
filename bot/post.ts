/**
 * bot エントリポイント
 *
 * 使い方:
 *   npm run bot:dry-run     # 投稿せず本文・画像URLを表示
 *   npm run bot:preview 3   # 今日から3スロット分の予定を表示
 *   npm run bot:post        # 実際に投稿（要 認証情報）
 *
 * 環境変数: bot/.env.example 参照
 */

import { loadConfig, missingCredentials } from "./config";
import { buildContentForSlot, jstDayNumber, globalSlot } from "./content";
import type { PostContent, PlatformName } from "./types";
import { XPublisher } from "./publish/x";
import { ThreadsPublisher } from "./publish/threads";
import { InstagramPublisher } from "./publish/instagram";
import { recordPost } from "./state";
import { CHARACTER_LIMITS } from "./publish/types";

interface CliOptions {
  dryRun: boolean;
  previewCount: number;
  slotOverride: number | null;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false, previewCount: 0, slotOverride: null };
  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--preview") opts.previewCount = 1;
    else if (arg.startsWith("--preview=")) opts.previewCount = Number(arg.split("=")[1]) || 1;
    else if (arg.startsWith("--slot=")) opts.slotOverride = Number(arg.split("=")[1]);
  }
  return opts;
}

/** 現在のJST時刻から日内スロット番号を決める（BOT_SLOT指定が優先） */
function currentSlotInDay(postsPerDay: number): number {
  const explicit = process.env.BOT_SLOT;
  if (explicit !== undefined && explicit !== "") {
    return Math.min(Math.max(0, Number(explicit) || 0), Math.max(1, postsPerDay) - 1);
  }
  const jstHour = (new Date().getUTCHours() + 9) % 24;
  const span = 24 / Math.max(1, postsPerDay);
  return Math.min(Math.floor(jstHour / span), postsPerDay - 1);
}

function makePublishers(
  platforms: PlatformName[],
  cfg: ReturnType<typeof loadConfig>
): Map<PlatformName, XPublisher | ThreadsPublisher | InstagramPublisher> {
  const map = new Map<PlatformName, XPublisher | ThreadsPublisher | InstagramPublisher>();
  for (const p of platforms) {
    if (p === "x" && cfg.x) map.set(p, new XPublisher(cfg.x));
    if (p === "threads" && cfg.threads) map.set(p, new ThreadsPublisher(cfg.threads));
    if (p === "instagram") map.set(p, new InstagramPublisher({ userId: "", accessToken: "" }));
  }
  return map;
}

/** 本文の文字数チェック（プラットフォーム固有上限） */
function validateContent(content: PostContent, platform: PlatformName): string | null {
  const limit = CHARACTER_LIMITS[platform];
  if (content.text.length > limit) {
    return `本文が${limit}文字を超えています (${content.text.length})`;
  }
  return null;
}

async function publishToPlatform(
  publisher: XPublisher | ThreadsPublisher | InstagramPublisher,
  content: PostContent,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`[${publisher.name}] (dry-run)`);
    console.log(content.text);
    console.log(`  → 画像: ${content.imageUrl ?? "なし"}`);
    console.log(`  → キー: ${content.dedupeKey}`);
    console.log("---");
    return;
  }

  const result = await publisher.publish(content);
  if (result.ok) {
    recordPost({ dedupeKey: content.dedupeKey, platform: publisher.name, id: result.id, url: result.url });
    console.log(`✅ [${publisher.name}] 投稿成功 id=${result.id}${result.url ? ` url=${result.url}` : ""}`);
  } else {
    console.error(`❌ [${publisher.name}] 投稿失敗: ${result.error}`);
  }
}

async function run(): Promise<void> {
  const cfg = loadConfig();
  const opts = parseArgs(process.argv.slice(2));

  if (!cfg.enabled) {
    console.log("BOT_ENABLED=false のためスキップ");
    return;
  }

  const missing = opts.dryRun || opts.previewCount > 0 ? [] : missingCredentials(cfg);
  const platforms = cfg.platforms.filter((p) => !missing.includes(p));
  if (!opts.dryRun && !opts.previewCount && missing.length > 0) {
    console.warn(`⚠️ 認証情報が不足しています（スキップ）: ${missing.join(", ")}`);
    console.warn("   bot/.env.example を参照して設定してください");
  }

  const dayNumber = jstDayNumber();
  const slotInDay = opts.slotOverride ?? currentSlotInDay(cfg.postsPerDay);
  const baseIdx = globalSlot(dayNumber, cfg.postsPerDay, slotInDay);

  const buildOpts = {
    siteUrl: cfg.siteUrl,
    maxLookbackDays: 30,
  };

  if (opts.previewCount > 0) {
    console.log(`📅 予定プレビュー（${opts.previewCount}スロット分）`);
    for (let i = 0; i < opts.previewCount; i++) {
      const gidx = baseIdx + i;
      for (const platform of cfg.platforms) {
        const content = buildContentForSlot({ ...buildOpts, platform, globalIdx: gidx });
        if (!content) continue;
        console.log(`\n[slot ${gidx} / ${platform}] (${content.type}) ${content.dedupeKey}`);
        console.log(content.text);
        console.log(`  → 画像: ${content.imageUrl ?? "なし"}`);
      }
    }
    return;
  }

  if (missing.length > 0) {
    console.warn(`⚠️ 認証情報が不足しています（スキップ）: ${missing.join(", ")}`);
    if (!opts.dryRun) console.warn("   bot/.env.example を参照して設定してください");
  }
  if (platforms.length === 0) {
    console.error("投稿対象のプラットフォームがありません");
    process.exit(1);
  }

  const publishers = makePublishers(platforms, cfg);
  if (publishers.size === 0) {
    console.error("投稿対象のプラットフォームがありません");
    process.exit(1);
  }

  for (const platform of platforms) {
    const publisher = publishers.get(platform)!;
    const content = buildContentForSlot({ ...buildOpts, platform, globalIdx: baseIdx });
    if (!content) {
      console.error(`[${platform}] 投稿コンテンツを生成できませんでした（素材不足 or 直近重複）`);
      continue;
    }

    const err = validateContent(content, platform);
    if (err) {
      console.error(`[${platform}] 投稿をスキップ: ${err}`);
      continue;
    }

    await publishToPlatform(publisher, content, opts.dryRun);
  }

  console.log("完了");
}

run().catch((err) => {
  console.error("bot の実行に失敗しました:", err);
  process.exit(1);
});
