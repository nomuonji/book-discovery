/**
 * Instagram Publisher（スケルトン）
 *
 * Instagram Graph API（Content Publishing API）は Threads とほぼ同じ
 * 「メディアコンテナ作成 → publish」の2段階フロー。
 * 要件が固まり次第、Threads Publisher を基に実装する。
 */

import type { PostContent, PostResult } from "../types";

export interface InstagramPublisherOptions {
  userId: string;
  accessToken: string;
}

export class InstagramPublisher {
  readonly name = "instagram" as const;

  constructor(private readonly opts: InstagramPublisherOptions) {
    void this.opts;
  }

  async publish(content: PostContent): Promise<PostResult> {
    void content;
    return {
      ok: false,
      platform: this.name,
      error: "Instagram 投稿は未実装です（要件が固まり次第実装）",
    };
  }
}
