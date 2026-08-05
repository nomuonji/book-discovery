/**
 * Threads Publisher
 *
 * Threads Graph API の2段階公開:
 * 1. `POST /{user-id}/threads`        → メディアコンテナを作成（TEXT または IMAGE）
 * 2. `POST /{user-id}/threads_publish` → 公開
 *
 * 前提: Meta for Developers アプリが公開（Live）状態であること、Threads アカウント連携済みであること。
 */

import type { PostContent, PostResult } from "../types";

const GRAPH_BASE = "https://graph.threads.net/v1.0";

interface ThreadsContainerResponse {
  id?: string;
  error?: { message?: string; code?: number };
}

interface ThreadsPublishResponse {
  id?: string;
  error?: { message?: string; code?: number };
}

export interface ThreadsPublisherOptions {
  userId: string;
  accessToken: string;
}

export class ThreadsPublisher {
  readonly name = "threads" as const;

  constructor(private readonly opts: ThreadsPublisherOptions) {}

  async publish(content: PostContent): Promise<PostResult> {
    try {
      const containerId = await this.createContainer(content);
      const published = await this.publishContainer(containerId);
      return {
        ok: true,
        platform: this.name,
        id: published?.id ?? containerId,
        url: undefined,
      };
    } catch (err) {
      return {
        ok: false,
        platform: this.name,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async createContainer(content: PostContent): Promise<string> {
    const params = new URLSearchParams({
      access_token: this.opts.accessToken,
      media_type: content.imageUrl ? "IMAGE" : "TEXT",
      text: content.text,
    });
    if (content.imageUrl) {
      params.set("image_url", content.imageUrl);
    }

    const res = await fetch(`${GRAPH_BASE}/${this.opts.userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const json = (await res.json()) as ThreadsContainerResponse;
    if (!res.ok || !json.id) {
      throw new Error(`Threads コンテナ作成失敗: ${JSON.stringify(json.error ?? json)}`);
    }
    return json.id;
  }

  private async publishContainer(containerId: string): Promise<ThreadsPublishResponse> {
    const params = new URLSearchParams({
      access_token: this.opts.accessToken,
      media_id: containerId,
    });

    const res = await fetch(`${GRAPH_BASE}/${this.opts.userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const json = (await res.json()) as ThreadsPublishResponse;
    if (!res.ok || !json.id) {
      throw new Error(`Threads 公開失敗: ${JSON.stringify(json.error ?? json)}`);
    }
    return json;
  }
}
