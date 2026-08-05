/**
 * Threads の長期トークンを Gist 状態から取得し、期限が近ければリフレッシュして書き戻す。
 *
 * Threads の長期トークンは自分自身をリフレッシュトークンとして使う
 * （grant_type=th_refresh_token & access_token=<現在のトークン>）。
 * 発行から24時間以上経過していないとリフレッシュできない点に注意。
 */

import { loadState, saveState, type ThreadsAccountState } from "./gistState";

const REFRESH_BEFORE_DAYS = Number(process.env.REFRESH_BEFORE_DAYS ?? "10");

interface RefreshResponse {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string };
}

function needsRefresh(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true;
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return true;
  const threshold = REFRESH_BEFORE_DAYS * 24 * 60 * 60 * 1000;
  return expires - Date.now() <= threshold;
}

async function refreshToken(currentToken: string): Promise<RefreshResponse> {
  const url = new URL("https://graph.threads.net/refresh_access_token");
  url.searchParams.set("grant_type", "th_refresh_token");
  url.searchParams.set("access_token", currentToken);
  const res = await fetch(url);
  const json = (await res.json()) as RefreshResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(`Threads token refresh failed: ${JSON.stringify(json)}`);
  }
  return json;
}

/**
 * Returns a usable {userId, accessToken} for the named account, refreshing
 * and persisting to the Gist first if the stored token is close to expiry.
 *
 * `dryRun` skips the refresh+write side effect (matches the pattern used for
 * the rest of the bot: --dry-run must never mutate external state) and just
 * returns whatever is currently stored.
 */
export async function getThreadsCredentials(
  accountName: string,
  dryRun = false,
): Promise<{ userId: string; accessToken: string }> {
  const state = await loadState();
  const account = state.accounts[accountName] as ThreadsAccountState | undefined;
  if (!account) {
    throw new Error(`アカウント ${accountName} が Gist の状態に見つかりません`);
  }

  if (dryRun || !needsRefresh(account.expires_at)) {
    return { userId: account.user_id, accessToken: account.token };
  }

  try {
    const refreshed = await refreshToken(account.token);
    account.token = refreshed.access_token!;
    account.expires_at = new Date(
      Date.now() + (refreshed.expires_in ?? 60 * 24 * 3600) * 1000,
    ).toISOString();
    await saveState(state);
    console.log(`[threads:${accountName}] トークンをリフレッシュしました（新期限 ${account.expires_at}）`);
  } catch (err) {
    // Refresh failing doesn't necessarily mean the current token is dead yet
    // (e.g. it's under 24h old); fall through and try posting with what we have.
    console.warn(`[threads:${accountName}] リフレッシュに失敗、現在のトークンで続行: ${(err as Error).message}`);
  }

  return { userId: account.user_id, accessToken: account.token };
}
