/**
 * bot 共通型定義
 */

export type PostType = "book" | "recommend" | "path" | "author";
export type PlatformName = "x" | "threads" | "instagram";

export interface PostContent {
  /** 投稿タイプ */
  type: PostType;
  /** 主対象のスラッグ（book/path/author のスラッグ） */
  slug: string;
  /** 投稿本文（ハッシュタグ・リンク込み・280文字以内にフィット済み） */
  text: string;
  /** 添付画像URL（任意） */
  imageUrl?: string;
  /** UTM キャンペーン名 */
  campaign: string;
  /** 重複チェック用キー（例: "book:norwegian-wood"） */
  dedupeKey: string;
}

export interface PostResult {
  ok: boolean;
  platform: PlatformName;
  /** 投稿ID（成功時） */
  id?: string;
  /** 投稿URL（成功時・Xのみ） */
  url?: string;
  error?: string;
}

export interface Publisher {
  readonly name: PlatformName;
  publish(content: PostContent): Promise<PostResult>;
}
