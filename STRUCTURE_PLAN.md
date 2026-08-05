# サイト構造化計画

## データ層の再設計

### ディレクトリ構造
```
src/data/
├── categories/          ← 本をカテゴリ別に分割
│   ├── philosophy.json  （哲学・思想 18冊）
│   ├── world-fiction.json （世界文学 12冊）
│   ├── contemporary-fiction.json （現代小説 16冊）
│   ├── nonfiction.json  （ノンフィクション 12冊）
│   └── sf-fantasy.json  （SF・幻想 6冊）
├── authors.json         ← 著者プロフィールを独立（全著者分）
├── reading-paths.json   ← 読書パス（既存のまま拡張）
├── recommendations.json ← レコメンド（既存のまま拡張）
├── taxonomy.json        ← ジャンル・タグの正規化定義
├── index.ts             ← 統合読み込み + バリデーション
└── validate.ts          ← データ整合性チェックスクリプト
```

### タクソノミ構造
- genres: 15種類（正規化、日本語ラベル・説明付き）
- tags: 約80種類（階層化：地域/時代/テーマ/形式）
- authors: 全員にslug・bioJa付与

### 新しいページタイプ
- `/categories/[slug]` — カテゴリ別一覧
- `/tags/[slug]` — タグ別一覧
- `/authors/[slug]` — 著者詳細（経歴＋著書一覧＋関連著者）
- `/books` — フィルター強化（カテゴリ/地域/年代/難易度）

### コンポーネント再編
- `BookGrid` — 共通グリッド（カラム・ソート標準化）
- `CategoryNav` — カテゴリ横断ナビ
- `TagBadge` — リンク付きタグ
- `AuthorCard` — 著者一覧用
- `SearchBar` — 横断検索（BookCard/AuthorCard両方対応）
- `BookMeta` — 本のメタ情報表示

### ナビゲーション強化
- ヘッダー：カテゴリドロップダウン追加
- パンくずの統一
- サイドバー（カテゴリ＋タグフィルター）
- サイトマップ的フッター
