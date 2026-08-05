/**
 * OAuth 1.0a HMAC-SHA1 署名（X API v2 用）
 * 外部ライブラリに依存せず、node:crypto だけで署名ヘッダーを生成する。
 */

import { createHmac, randomBytes } from "node:crypto";

export interface OAuthCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * OAuth 1.0a Authorization ヘッダーを生成する。
 * @param method HTTP メソッド
 * @param url 完全なURL（クエリなし）
 * @param params リクエストパラメータ（クエリ/フォーム。multipart の場合は空）
 */
export function buildOAuthHeader(
  credentials: OAuthCredentials,
  method: "GET" | "POST",
  url: string,
  params: Record<string, string> = {}
): string {
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = credentials;

  const oauth = {
    oauth_consumer_key: apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // 署名対象パラメータ（oauth + リクエストパラメータ）を結合し、キー順でソート
  const allParams: Record<string, string> = { ...params, ...oauth };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  const signed = { ...oauth, oauth_signature: signature } as Record<string, string>;
  const headerParts = Object.keys(signed)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(signed[k])}"`);

  return `OAuth ${headerParts.join(", ")}`;
}
