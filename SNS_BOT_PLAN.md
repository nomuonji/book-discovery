# SNS集客Bot運用設計 — 読書の羅針盤

## 0. 目的と非目標

### 目的
サイト「読書の羅針盤」への流入を、X / Threads（将来的にInstagram）での**自動投稿**によって安定的に作る。投稿から `utm_source=sns` 付きリンクで本ページ `/books/[slug]` へ誘導し、訪問→「次の一冊」の発見→回遊を増やす。

### 非目標
- 自動いいね・自動リプライ・自動フォロー（エンゲージメントbotは凍結リスクが高く、本設計の対象外）
- DM自動返信・サポートbot
- バズ狙いの不自然な投稿（凍結・レピュテーションリスク）
- 画像の自作（書影・Open Libraryの実在画像のみを使う）

### 成功指標（計測対象）
| 指標 | 目標（運用開始後30日） |
|------|----------------------|
| SNS経由の流入セッション | GA4で確認し週次レビュー |
| 投稿1件あたりのCTR（リンククリック率） | 1%以上 |
| 投稿からのコンバージョン（本ページ閲覧→2ページ目閲覧） | 閲覧単価で改善トレンド |
| フォロワー増加 | 週+1%以上を目安にしつつ、数字より品質 |

## 1. システム構成

```
bot/
  config.ts        # 環境変数・設定の読み込み
  oauth.ts         # X API v2 用 OAuth 1.0a HMAC-SHA1 署名
  types.ts         # PostContent / Publisher 型
  content.ts       # コンテンツ選択（決定的ローテーション）とテンプレート描画
  state.ts         # 投稿ログ（監査用・再投稿抑止の補助）
  publish/
    types.ts       # Publisher インターフェース
    x.ts           # X Publisher（v2 tweet + v1.1 media upload）
    threads.ts     # Threads Publisher（Graph API）
  post.ts          # エントリポイント（--dry-run 対応）
  .env.example     # 設定テンプレート
.github/workflows/sns-bot.yml  # cron スケジューリング
```

- 実行は **`npx tsx`**（プロジェクトの既存パターン `src/data/split.ts` と同一）
- Next.js アプリ本体からは独立した**外部スクリプト**。アプリのデプロイとは無関係に動作する
- 認証情報は環境変数（GitHub Actions Secrets または Vercel Cron では環境変数）で管理し、リポジトリにコミットしない

## 2. 投稿コンテンツ設計

### 2-1. コンテンツタイプと週間カレンダー
既存データ（411冊・レコメンド234件・読書パス12本）を素材に、決定的ローテーションで毎日1〜2件投稿する。

| タイプ | 内容 | 使うデータ | リンク先 |
|--------|------|-----------|---------|
| `book` | 本の紹介＋選書理由 | descriptionJa / selectionReasonJa / whyReadJa / 書影 | `/books/[slug]` |
| `recommend` | 「これが好きなら→これ」 | recommendations.json の reasonJa | `/books/[toSlug]` |
| `path` | 読書パスの案内 | paths.json の descriptionJa / steps | `/paths/[slug]` |
| `author` | 作家スポットライト | authors.json の収録作品 | `/authors/[slug]` |

- 曜日・投稿スロットから**決定論的**にコンテンツを選ぶ（同じ日に同じ本が二度出ない。状態管理に依存しない）
- `TYPE_SEQUENCE = [book, recommend, book, path, author, book, recommend]` を曜日で巡回
- 2回/日に増やす場合は朝・夜のスロットで別コンテンツを選ぶ

### 2-2. 投稿テンプレート（例：X）

**book**
```
📖 今日の一冊

『ノルウェイの森』村上春樹
日本・1987 / 小説

海外で最も読まれた日本文学の一つ。ここを起点に、世界が評価する
日本文学とその源泉を探索できる。

#読書 #海外文学 #日本文学 #村上春樹
🔗 reading-compass.vercel.app/books/norwegian-wood
```

**recommend**
```
🎯 『ノルウェイの森』が好きなら

→ 『クララとお日さま』（カズオ・イシグロ）

無垢な視点から見た愛と喪失。静かな語り口と余白の美学が春樹作品と響き合う。

#読書 #海外文学
🔗 reading-compass.vercel.app/books/klara-and-the-sun
```

**path**
```
🗺️ 読書パス「村上春樹から世界文学へ」

影響と共鳴の読書パス。春樹を入口に、アメリカ・ラテンアメリカ・
ヨーロッパ実験文学へ視野を広げる。

ステップ①『ノルウェイの森』→ ②『愛について語る…』→…

#読書 #読書メモ
🔗 reading-compass.vercel.app/paths/murakami-to-world-literature
```

### 2-3. 文字数・規約
- X: 280文字以内。ハッシュタグは固定 `#読書 #海外文学` ＋ 本のタグから最大2つ
- Threads: 500文字以内
- 全本文末に**トラッキング付きリンク**を付与（`utm_source=twitter|threads&utm_medium=social&utm_campaign=book|recommend|path|author`）
- リンクは文字数節約のため `https://` を省略せず、CTA文言と共に記載
- 紹介文は既存のAI生成テキストをそのまま使い、**事実として書かれていないことを捏造しない**
- 各パブリッシャーが投稿前に必ず文字数検証を行い、超過時は本文の要約部を自動カット

## 3. パブリッシャー設計

### 3-1. 共通インターフェース
```ts
interface Publisher {
  name: "x" | "threads";
  publish(content: PostContent): Promise<PostResult>;
}
```
`PostContent` に `text / url / imageUrl / hashtags / campaign` を持たせ、各パブリッシャーが描画ルール（文字数・画像仕様）を適用する。

### 3-2. X（Twitter）Publisher
- **API v2** `POST https://api.twitter.com/2/tweets`（OAuth 1.0a user-context。`oauth.ts` でHMAC-SHA1署名を実装）
- **画像**: v1.1 `POST https://upload.twitter.com/1.1/media/upload.json` に書影をmultipartアップロード → `media_id_string` を取得 → tweet に `media.media_ids` で添付
- 書影の取得失敗時は**画像なしで投稿**（致命的エラーにしない）
- 注意: X API v2 の書き込み権限は**有料プラン（Basic〜）必須**。無料プランでは投稿不可。運用前にアカウントで「Read+Write」を付与

### 3-3. Threads Publisher
- **Threads Graph API**（`graph.threads.net`）
  1. `POST /{user-id}/threads` でメディアコンテナを作成（`media_type=TEXT|IMAGE`）
  2. `POST /{user-id}/threads_publish` で公開
- IMAGE時は `image_url` に公開URL（Open Libraryの書影）を渡す
- 前提: Meta for Developers のアプリ作成と公開状態（Live）への昇格、Threadsアカウントの連携

### 3-4. 将来: Instagram Publisher
同じ Graph API 系統（Instagram Content Publishing API）。コンテンツ生成・スケジューラはそのまま流用でき、Publisher を追加するだけ。実装時点では `publish/instagram.ts` のスケルトンのみ置く。

## 4. スケジューリング

| 方式 | タイミング | 備考 |
|------|-----------|------|
| **GitHub Actions cron**（本命） | 毎日 12:00 / 20:00 JST（03:00 / 11:00 UTC） | Secrets に認証情報を設定。無料・リポジトリ管理と一体 |
| Vercel Cron（代替） | `cron.json` で毎日 | 本botは外部スクリプトのため、アプリ内APIルート経由で実行する構成に変更が必要 |

- cron の遅延・失敗に備え、投稿は**決定論的選択**なので再実行しても重複しない
- 実行ログは `bot/state/published.json` に追記し、監査と再投稿の防止に使う

## 5. 認証情報（環境変数）

| 変数 | 用途 |
|------|------|
| `X_API_KEY` / `X_API_SECRET` | X コンシューマーキー |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | X ユーザーアクセストークン（Write権限） |
| `THREADS_USER_ID` | Threads ユーザーID |
| `THREADS_ACCESS_TOKEN` | Threads Graph API トークン |
| `SITE_URL` | サイトURL（既定: `https://reading-compass.vercel.app`） |
| `BOT_PLATFORMS` | 投稿対象（既定: `x,threads`） |
| `BOT_POSTS_PER_DAY` | 1日あたり投稿数（既定: 1） |

`.env.example` にコメント付きテンプレートを用意。`.env*` は `.gitignore` 済み。

## 6. リスク管理・フェイルセーフ

1. **dry-run**: `npm run bot:dry-run` で投稿せずに本文・画像・リンクをプレビューできる
2. **投稿前バリデーション**: 文字数・URL整形・空テキスト禁止。エラーなら投稿を中断
3. **個別プラットフォームの失敗分離**: X が失敗しても Threads は続行
4. **凍結リスク対策**: 自動いいね・リプライ・フォローはしない。投稿頻度は1日1〜2件に抑える。書影はライセンスクリアな実在カバーに限定
5. **Kill switch**: 環境変数 `BOT_ENABLED=false` で即停止
6. **ログ**: `bot/state/*.log` に投稿結果（成功/失敗・メッセージID）を残す

## 7. 運用フロー（立ち上げ〜回す）

1. **準備**: X API 有料プラン＋Read/Write権限、Metaアプリ公開、アカウント2つ（X・Threads）の投稿権限確認
2. **試運転**: `npm run bot:dry-run` で本文確認 → 手動で1回投稿
3. **自動化**: GitHub Actions に Secrets を設定し cron 起動
4. **計測**: GA4 で `utm_source=sns` セグメントを週次確認。CTR低いタイプはテンプレートを改善
5. **チューニング**: 曜日・時間帯・コンテンツタイプの比率をデータで調整

## 8. 実装チェックリスト（v1）

- [ ] `bot/` の基盤（config / oauth / content / state / types）
- [ ] X Publisher（media upload + v2 tweet）
- [ ] Threads Publisher（コンテナ作成→公開）
- [ ] `post.ts` エントリ + `--dry-run`
- [ ] `package.json` scripts（`bot:dry-run` / `bot:post`）
- [ ] `.env.example` / `.github/workflows/sns-bot.yml`
- [ ] 手動1回投稿の実機確認（要認証情報）
