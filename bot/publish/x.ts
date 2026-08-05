/**
 * X (Twitter) Publisher
 *
 * - 画像: v1.1 `POST https://upload.twitter.com/1.1/media/upload.json` に書影を multipart でアップロード
 *   → media_id_string を取得
 * - 本文: v2 `POST https://api.twitter.com/2/tweets`（OAuth 1.0a user-context）
 *
 * 参考: X API v2 の投稿には有料プラン（Basic〜）と「Read+Write」権限が必要。
 */

import type { PostContent, PostResult } from "../types";
import { buildOAuthHeader } from "../oauth";

const TWEET_URL = "https://api.twitter.com/2/tweets";
const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

interface MediaUploadResponse {
  media_id_string?: string;
  errors?: { message?: string }[];
}

interface TweetResponse {
  data?: { id?: string; text?: string };
  errors?: { message?: string; code?: number }[];
}

export interface XPublisherOptions {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export class XPublisher {
  readonly name = "x" as const;

  constructor(private readonly opts: XPublisherOptions) {}

  async publish(content: PostContent): Promise<PostResult> {
    try {
      const mediaId = content.imageUrl ? await this.uploadMedia(content.imageUrl) : undefined;
      const tweet = await this.postTweet(content.text, mediaId);
      return {
        ok: true,
        platform: this.name,
        id: tweet?.id,
        url: tweet?.id ? `https://x.com/i/status/${tweet.id}` : undefined,
      };
    } catch (err) {
      return {
        ok: false,
        platform: this.name,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** 書影をダウンロードして media_id_string を取得する */
  private async uploadMedia(imageUrl: string): Promise<string> {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`書影の取得に失敗しました: ${imageRes.status} ${imageUrl}`);
    const buffer = Buffer.from(await imageRes.arrayBuffer());

    const authHeader = buildOAuthHeader(
      this.creds(),
      "POST",
      MEDIA_UPLOAD_URL
    );

    // multipart/form-data を手組み（OAuth署名には body パラメータを含めない）
    const boundary = `----bot${Date.now()}`;
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="media"; filename="cover.jpg"\r\n` +
          `Content-Type: application/octet-stream\r\n\r\n`
      ),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(MEDIA_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    const json = (await res.json()) as MediaUploadResponse;
    if (!res.ok || !json.media_id_string) {
      throw new Error(`メディアアップロード失敗: ${JSON.stringify(json.errors ?? json)}`);
    }
    return json.media_id_string;
  }

  private async postTweet(text: string, mediaId?: string): Promise<TweetResponse["data"]> {
    const authHeader = buildOAuthHeader(this.creds(), "POST", TWEET_URL);
    const body: Record<string, unknown> = { text };
    if (mediaId) body.media = { media_ids: [mediaId] };

    const res = await fetch(TWEET_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as TweetResponse;
    if (!res.ok || !json.data) {
      throw new Error(`ツイート投稿失敗: ${JSON.stringify(json.errors ?? json)}`);
    }
    return json.data;
  }

  private creds() {
    return {
      apiKey: this.opts.apiKey,
      apiSecret: this.opts.apiSecret,
      accessToken: this.opts.accessToken,
      accessTokenSecret: this.opts.accessTokenSecret,
    };
  }
}
