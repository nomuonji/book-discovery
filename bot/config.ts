/**
 * bot 設定読み込み
 * .env ファイル（bot/.env または ルート .env）と環境変数から設定を解決する
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { PlatformName } from "./types";

/** 指定のディレクトリから .env を読み込み process.env に反映（未設定の変数のみ） */
function loadDotEnv(): void {
  const candidates = [path.join(process.cwd(), ".env"), path.join(process.cwd(), "bot", ".env")];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    break; // 最初に見つかった .env だけ使う
  }
}

export interface BotConfig {
  enabled: boolean;
  siteUrl: string;
  platforms: PlatformName[];
  postsPerDay: number;
  dryRun: boolean;
  /** Account key inside the Gist state used for Threads credentials. */
  threadsGistAccount: string;
  x?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  /** Populated at runtime from the Gist state (see threadsAuth.ts), not from env. */
  threads?: {
    userId: string;
    accessToken: string;
  };
}

function env(name: string): string {
  return process.env[name] ?? "";
}

export function loadConfig(): BotConfig {
  loadDotEnv();

  // This project only runs Threads (kanna_neko_xx) for now. X support is kept
  // in the codebase (publish/x.ts, oauth.ts) in case it's wired up later, but
  // is not part of the default platform set.
  const platforms = (env("BOT_PLATFORMS") || "threads")
    .split(",")
    .map((p) => p.trim().toLowerCase() as PlatformName)
    .filter((p): p is PlatformName => ["x", "threads", "instagram"].includes(p));

  const dryRun = process.argv.includes("--dry-run");

  const config: BotConfig = {
    enabled: (env("BOT_ENABLED") || "true").toLowerCase() !== "false",
    siteUrl: env("SITE_URL") || "https://books.antonbase.com",
    platforms,
    postsPerDay: Number(env("BOT_POSTS_PER_DAY")) || 1,
    dryRun,
    threadsGistAccount: env("THREADS_GIST_ACCOUNT") || "kanna_neko_xx",
  };

  if (platforms.includes("x")) {
    config.x = {
      apiKey: env("X_API_KEY"),
      apiSecret: env("X_API_SECRET"),
      accessToken: env("X_ACCESS_TOKEN"),
      accessTokenSecret: env("X_ACCESS_TOKEN_SECRET"),
    };
  }
  // config.threads is intentionally NOT populated here — Threads credentials
  // come from the Gist-managed state (see threadsAuth.ts) because the token
  // needs to be refreshed and persisted across runs, which plain env vars
  // can't do. post.ts fills it in before publishing.
  return config;
}

/** 設定が不足しているプラットフォームの一覧を返す（投稿をスキップするため） */
export function missingCredentials(config: BotConfig): PlatformName[] {
  const missing: PlatformName[] = [];
  if (config.platforms.includes("x")) {
    const c = config.x;
    if (!c?.apiKey || !c.apiSecret || !c.accessToken || !c.accessTokenSecret) missing.push("x");
  }
  if (config.platforms.includes("threads")) {
    // config.threads is populated at runtime from the Gist (see post.ts /
    // threadsAuth.ts); it can legitimately be undefined if that fetch failed.
    const c = config.threads;
    if (!c?.userId || !c.accessToken) missing.push("threads");
  }
  return missing;
}
