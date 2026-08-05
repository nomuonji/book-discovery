# 洋書発見サイト 実装計画

## コンセプト
**「読書の羅針盤」** — 海外の現代作家や思想・哲学・人文書を、日本語話者のために発見できるサイト。
- 「村上春樹が好きなら、これも」的なレコメンド
- 「この順番で読むと思想が理解できる」読書ガイドパス

## 技術スタック
- **Next.js 14+** (App Router) + TypeScript
- **Tailwind CSS** (スタイリング)
- **JSONファイル** でデータ管理（DB不要、AIが生成したJSONをそのまま使える）
- **Vercel** 想定のデプロイ（静的生成 + ISR）

## ページ構成

### `/` ホーム
- ヒーローセクション「あなたの次の一冊を、世界から」
- 特集：今月の読書パス
- ピックアップ作家
- 「こんな作家が好きなら」検索窓（メインCTA）

### `/books` 本一覧
- フィルター：ジャンル / 国・地域 / 年代
- カード型一覧（表紙 + タイトル + 著者 + 一言紹介）
- ソート：おすすめ順 / 新しい順

### `/books/[slug]` 本の詳細
- 基本情報（タイトル原語＋日本語、著者、国、出版年）
- AI生成の紹介文（内容、どんな人におすすめか）
- 「この本が好きな人へのおすすめ」カルーセル
- 「この本が属する読書パス」リンク

### `/paths` 読書パス一覧
- カード一覧（「フランス現代思想入門」等）
- 含まれる本の数、難易度表示
- サムネイル（パス内の代表的な本の表紙）

### `/paths/[slug]` 読書パス詳細
- パスの概要・目的（「この思想を理解するために」）
- ステップバイステップの読書順（1→2→3→...）
- 各ステップに「なぜこの順番か」「ここで何を掴むか」の解説
- 各本はクリックで詳細ページへ

### `/recommend` レコメンド検索
- 「好きな作家・本を入力してください」
- 作家名のオートコンプリート
- 結果：「あなたにおすすめの3冊」＋それぞれの推薦理由

## データモデル

### Book
```ts
{
  slug: string;           // "the-end-of-the-affair"
  title: string;          // "The End of the Affair"（原語）
  titleJa: string;        // "情事の終わり"（邦題、なければ直訳）
  author: string;         // "Graham Greene"
  authorJa: string;       // "グレアム・グリーン"
  country: string;        // "イギリス"
  year: number;           // 1951
  genre: string[];        // ["小説", "イギリス文学"]
  coverUrl: string;       // 書影URL
  descriptionJa: string;  // AI生成の紹介文（200字程度）
  whyReadJa: string;      // 「なぜ読むべきか」（150字程度）
  tags: string[];         // ["実存主義", "愛", "信仰"]
}
```

### Recommendation
```ts
{
  fromSlug: string;       // 元の本（"Norwegian Wood" → これが好きなら）
  toSlug: string;         // おすすめ本
  reasonJa: string;       // 推薦理由（「同じく喪失と記憶を...」）
  type: "similar-vibe" | "similar-theme" | "if-you-like-author" | "reading-path";
}
```

### ReadingPath
```ts
{
  slug: string;
  titleJa: string;        // "フランス現代思想への招待"
  descriptionJa: string;  // 概要
  difficulty: 1 | 2 | 3; // 入門 / 中級 / 発展
  steps: {
    order: number;
    bookSlug: string;
    noteJa: string;       // 「まずはこれを。カミュの不条理の概念を掴む」
    keyConceptJa: string; // この本で掴むべき概念
  }[];
}
```

### AuthorPage
```ts
{
  slug: string;
  name: string;
  nameJa: string;
  bioJa: string;
  similarAuthors: { slug: string; reasonJa: string }[];
}
```

## 実装ステップ

### Step 1: プロジェクトセットアップ
- Next.js + TypeScript + Tailwind 初期化
- ディレクトリ構造設計
- 基本レイアウト（ヘッダー・フッター）

### Step 2: データ層
- 型定義
- JSONデータファイルの作成（初期シードデータ20冊程度＋AI生成）
- データ読み込みユーティリティ（slugでの検索、ジャンルフィルタ等）

### Step 3: 本の一覧・詳細ページ
- `/books` 一覧（フィルター・ソート）
- `/books/[slug]` 詳細（レコメンドカルーセル付き）

### Step 4: 読書パス
- `/paths` 一覧
- `/paths/[slug]` ステップバイステップ表示

### Step 5: レコメンド機能
- `/recommend` 検索＋結果表示
- 著者オートコンプリート
- 「〜が好きなら」のマッチングロジック

### Step 6: ホームページ
- ヒーロー＋特集＋ピックアップ

### Step 7: データ拡充 + 仕上げ
- 初期シードデータをAI（Claude）で充実させる
- OGP/SEO設定
- レスポンシブ調整

## シードデータ案（最初の20冊）
村上春樹好き → レイモンド・カーヴァー、リチャード・ブローティガン、カート・ヴォネガット
現代思想入口 → カミュ『シーシュポスの神話』→ サルトル『実存主義とは何か』→ フーコー『監獄の誕生』
海外評価の高い現代作家 → オルガ・トカルチュク、エレナ・フェッランテ、ハン・ガン、W.G.ゼーバルト
