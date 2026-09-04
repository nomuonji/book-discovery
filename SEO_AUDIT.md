# SEO監査（book-discovery）

監査日: 2026-09-02  
対象: `D:\youph\Blog\Wiki\book-discovery`  
基準: `D:\youph\Blog\SEO_REMEDIATION_PLAN.md` フェーズ1-1、フェーズ2-2

## 今回の技術修正

- 公開URLは「ホームは `/`、その他のルートは末尾 `/`」に統一した。
- `next.config.ts` に `trailingSlash: true` を設定した。Next.js の静的exportでは、これにより `/books/` が `out/books/index.html` として出力される。
- `src/lib/seo.ts` にURL正規化ヘルパーを追加し、`buildMetadata` の canonical と `og:url` を同じ正規化結果から生成するようにした。
- ルートレイアウトの canonical、OG URL、`metadataBase` を `https://books.antonbase.com/` に統一した。
- `src/app/sitemap.ts` は同じヘルパーを使用し、全1,406件（ホームを除く1,405件）を末尾 `/` で出力する。
- robotsのサイトマップ参照はファイルURLのため `https://books.antonbase.com/sitemap.xml` とした（`.xml` は末尾 `/` を付けない）。
- 内部リンク、検索フォーム、クエリ付き回遊リンクも、配信ルート部分を末尾 `/` に揃えた。

## sitemap URL種別集計

ビルド後の `out/sitemap.xml` を `<loc>` 単位で集計した。低価値候補の判定後、sitemapはindexableページだけを掲載する。重複URLは0件。

| ページ種別 | URL数 | 判定メモ |
| --- | ---: | --- |
| ホーム | 1 | 固定の入口ページ |
| 固定（本を探す・読書パス・おすすめ） | 3 | サイトの主要導線 |
| カテゴリ | 6 | 6ジャンルの説明と書籍一覧 |
| 書籍詳細 | 465 | 書誌、説明、関連本、読書パスを持つ主コンテンツ |
| 読書パス詳細 | 17 | 順番と理由を持つ編集型の導線 |
| 著者 | 317 | 共通判定を通過した著者ページ |
| タグ | 242 | 2冊以上の書籍が紐づくタグページ |
| **合計** | **1,051** | `out/sitemap.xml` の実測値 |

## 低価値候補（削除・統合は未実施）

今回の判定は、ページ自体と内部リンクを残したまま、候補だけを `noindex,follow` としてsitemapから外す安全な縮小である。判定不能はindexableを維持する。

### 共通の機械判定基準と対象一覧

判定関数は `src/lib/data.ts` の `isIndexableTag` / `isIndexableAuthor` に集約し、`src/app/sitemap.ts` と各動的metadataで共通利用する。

| 対象 | 全URL | indexable基準（関数の条件） | indexable | noindex,follow | 理由 |
| --- | ---: | --- | ---: | ---: | --- |
| タグ | 592 | `count >= 2` | 242 | 350 | タグデータに固有説明フィールドがなく、1冊だけでは一覧以上の価値を確認できない |
| 著者 | 322 | `bookCount >= 2 || bioLength === 0 || bioLength >= 80` | 317 | 5 | 1冊かつプロフィール77〜79文字だけを対象。2冊以上、十分な固有プロフィール、プロフィール欠落（判断不能）は維持 |

前回のindexable URL数 **1,406件** から、タグ350件・著者5件を除外し、今回のindexable URL数は **1,051件**（355件減）となった。noindex対象も静的生成され、canonicalと内部リンクは維持される。

### タグ

- 対象: **592 URL**。このうち **242 URL** はsitemap掲載、**350 URL**（全て1冊のみ）は `noindex,follow`。
- 参考: 350 URL（59.1%）が1冊のみ、431 URL（72.8%）が2冊以下。
- `src/app/tags/[slug]/page.tsx` はタグ名、冊数、書籍グリッド、関連タグをデータから生成する。冊数が少ないタグは、独自の説明や比較軸がない場合に、検索者へ一覧以上の価値を出しにくい。
- ただし、少数でも固有テーマとして説明価値があるタグを一律に除外しない。まずタグごとの検索意図、重複、説明追加可否をレビューする。

### 著者

- 対象: **322 URL**。このうち **317 URL** はsitemap掲載、**5 URL**（1冊かつプロフィール80文字未満）は `noindex,follow`。
- 参考: 238 URL（73.9%）が1冊のみ、287 URL（89.1%）が2冊以下。
- `src/app/authors/[slug]/page.tsx` は著書、関連テーマ、推薦、同国の著者を表示するが、書籍数が少ないページほど一覧部分の固有情報が限定される。著者紹介・代表作比較・読む順番などの編集価値が不足するものを優先確認する。
- 1冊の著者でも、著者自体の検索需要や紹介文の独自性が確認できる場合は維持候補とする。

今回 `noindex,follow` になった著者URL（全件）は次の5件。いずれも1冊・プロフィール77〜79文字である。

| URL | 紐づき冊数 | プロフィール文字数 |
| --- | ---: | ---: |
| `/authors/gwf-hegel/` | 1 | 77 |
| `/authors/jean-jacques-rousseau/` | 1 | 77 |
| `/authors/miguel-de-cervantes/` | 1 | 78 |
| `/authors/ludwig-wittgenstein/` | 1 | 76 |
| `/authors/cao-xueqin/` | 1 | 79 |

タグのnoindex対象一覧は「`getAllTags()` の `count === 1`」を満たす350件の全タグであり、次のコマンドで同じ共通データから再現できる（URLエンコードは生成時にNext.jsが行う）。

```powershell
npx tsx -e "import {getAllTags,isIndexableTag} from './src/lib/data'; console.log(getAllTags().filter(t=>!isIndexableTag(t)).map(t=>'/tags/'+encodeURIComponent(t.slug)+'/').join('\\n'))"
```

### 組合せ・検索パラメータ

- sitemapに含まれる組合せURLは **0件**。`out/sitemap.xml` は固定ルートとデータ由来の正規ページだけを列挙している。
- `/books/?q=...`、`/books/?genre=...` はクライアント側の検索・絞り込みであり、組合せごとの静的ページは生成していない。これらのページの metadata は `/books/` を canonical とする。
- 将来、フィルタをURL単位で集約・公開する場合は、固有の説明・結果の安定性・canonical方針を先に定義し、無制限な組合せをsitemapへ追加しない。

## 検証結果

- `npm run build`: 成功（Next.js 16.3.0、静的ページ1,411件生成）。
- `out/sitemap.xml`: 1,051 URL、重複0、ホーム以外の末尾スラッシュ欠落0。旧1,406件から355件減。
- `npm run verify:seo`: 成功（sitemap全件のファイル存在・canonical一致・noindex混入なし、タグ/著者のsitemapとrobots判定一致、noindexのfollow維持、内部ルートの末尾スラッシュ違反0）。
- 代表HTML（ホーム、書籍、著者、indexable/noindexタグ）の canonical と `og:url`: いずれも配信ルートの末尾 `/` と一致。
- 動的ページの生成結果: タグ indexable242 / noindex350、著者 indexable317 / noindex5。noindexページのHTMLと内部リンクは維持。
- 生成HTML全体の内部 `href` / form action（静的ファイルと外部Amazonリンクを除く）: 末尾スラッシュ欠落0。
- `out/robots.txt`: `Sitemap: https://books.antonbase.com/sitemap.xml` を出力。
- 未追跡の `bot/PERSONA.md` は変更していない。公開、push、commitは実施していない。

## 残課題

1. Cloudflare Pages previewまたは本番で、代表URLとランダム20 URLのHTTP最終応答が200であること、リダイレクト先とcanonicalが一致することを確認する。
2. タグ350件（1冊）と著者5件（1冊・プロフィール80文字未満）を、検索意図・固有説明・重複の観点で個別レビューする。固有価値を追加できた場合は判定関数の入力データを更新して再評価する。
3. 低価値候補の判断後にのみ、統合先、301、廃止を台帳化して実施する。今回の削除・統合・301は未実施で、noindexは上記の共通機械基準に該当する355件だけに適用した。
4. GSC URL検査の標本と登録率は未計測。外部変更権限が必要なサイトマップ再送信も未実施。

本監査だけでは remediation hold の解除条件を満たさない。次回はpreview HTTP検証、コンテンツ判断、GSC標本を追加してから再判定する。
