/**
 * GitHub Gist を状態ストアとして読み書きする。
 *
 * Threads の長期アクセストークンは約60日で失効するため、定期的なリフレッシュが要る。
 * GitHub Actions のランナーは実行のたびに使い捨てられるので、リフレッシュ後の新しい
 * トークンをどこかに永続化しないと次回また古いトークンで失敗する。リポジトリに書き戻すと
 * 公開リポジトリの git 履歴にトークンが残ってしまうため、この Gist に保存する。
 *
 * 必要な環境変数:
 *   GH_GIST_TOKEN : gist スコープのみを持つ GitHub PAT
 *   GIST_ID       : 状態を保存する Secret Gist の ID
 *   LOCAL_STATE_FILE : (任意・ローカル検証用) 指定するとこのファイルを Gist の代わりに読み書きする
 */

const API = "https://api.github.com";
const DEFAULT_FILENAME = "sns_state.json";

export interface ThreadsAccountState {
  platform: "threads";
  user_id: string;
  token: string;
  expires_at?: string;
}

export interface BotState {
  accounts: Record<string, ThreadsAccountState>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`環境変数 ${name} が未設定です`);
  return value;
}

async function githubRequest(
  method: string,
  url: string,
  token: string,
  payload?: unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${method} ${url}: ${await res.text()}`);
  }
  return res.json();
}

export async function loadState(): Promise<BotState> {
  const local = process.env.LOCAL_STATE_FILE;
  if (local) {
    const fs = await import("node:fs");
    return JSON.parse(fs.readFileSync(local, "utf-8")) as BotState;
  }

  const token = requireEnv("GH_GIST_TOKEN");
  const gistId = requireEnv("GIST_ID");
  const filename = process.env.GIST_FILENAME || DEFAULT_FILENAME;

  const gist = (await githubRequest("GET", `${API}/gists/${gistId}`, token)) as {
    files: Record<string, { content: string }>;
  };
  const file = gist.files[filename];
  if (!file) {
    throw new Error(`Gist に ${filename} が見つかりません。存在: ${Object.keys(gist.files)}`);
  }
  return JSON.parse(file.content) as BotState;
}

export async function saveState(state: BotState): Promise<void> {
  const local = process.env.LOCAL_STATE_FILE;
  if (local) {
    const fs = await import("node:fs");
    fs.writeFileSync(local, JSON.stringify(state, null, 2), "utf-8");
    return;
  }

  const token = requireEnv("GH_GIST_TOKEN");
  const gistId = requireEnv("GIST_ID");
  const filename = process.env.GIST_FILENAME || DEFAULT_FILENAME;

  await githubRequest("PATCH", `${API}/gists/${gistId}`, token, {
    files: { [filename]: { content: JSON.stringify(state, null, 2) } },
  });
}
