/**
 * 投稿状態管理
 * bot/state/published.json に投稿履歴を記録し、直近の重複投稿を防ぐ。
 * 決定論的選択の補助なので、ファイルが無い場合は空として扱う。
 */

import * as fs from "node:fs";
import * as path from "node:path";

const STATE_DIR = path.join(__dirname, "state");
const STATE_FILE = path.join(STATE_DIR, "published.json");

interface PublishedRecord {
  dedupeKey: string;
  platform: string;
  postedAt: string; // ISO 日時（JST 変換前の UTC）
  id?: string;
  url?: string;
  /** 記事リンク。本投稿には含めず、翌スロットでコメントとして時差付与する */
  link?: string;
  /** リンクコメントを付与済みか（時差付与の完了フラグ） */
  linkCommentPosted?: boolean;
}

let _cache: PublishedRecord[] | null = null;

function load(): PublishedRecord[] {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as { published: PublishedRecord[] };
      _cache = parsed.published ?? [];
    } else {
      _cache = [];
    }
  } catch {
    _cache = [];
  }
  return _cache;
}

function save(records: PublishedRecord[]): void {
  _cache = records;
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ published: records }, null, 2), "utf-8");
}

/** 指定キーが直近 maxLookbackDays 日以内に投稿済みか */
export function wasPostedRecently(dedupeKey: string, maxLookbackDays: number): boolean {
  const records = load();
  const cutoff = Date.now() - maxLookbackDays * 24 * 60 * 60 * 1000;
  return records.some((r) => r.dedupeKey === dedupeKey && new Date(r.postedAt).getTime() >= cutoff);
}

/** 投稿成功を記録する（dry-run では呼ばない） */
export function recordPost(record: Omit<PublishedRecord, "postedAt">): void {
  const records = load();
  // 同じ dedupeKey + platform の古い記録は置き換え
  const filtered = records.filter((r) => !(r.dedupeKey === record.dedupeKey && r.platform === record.platform));
  filtered.push({ ...record, postedAt: new Date().toISOString() });
  // 1,000件を超えたら古いものから削除
  const trimmed = filtered.slice(-1000);
  save(trimmed);
}

/**
 * リンクコメントをまだ付与していない「最古」の投稿を返す（時差付与の対象）。
 * リンクコメントは本投稿直後ではなく翌スロットに付けることで、
 * 本投稿のリーチがリンクで絞られないようにする。
 */
export function findPendingLinkComment(platform: string): PublishedRecord | undefined {
  return load()
    .filter((r) => r.platform === platform && r.link && !r.linkCommentPosted)
    .sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime())[0];
}

/** リンクコメントの付与完了を記録する（成功時のみ呼ぶ） */
export function markLinkCommentPosted(postId: string): void {
  const records = load();
  const target = records.find((r) => r.id === postId);
  if (!target) return;
  target.linkCommentPosted = true;
  save(records);
}
