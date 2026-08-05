/**
 * Amazonアソシエイト リンクユーティリティ
 * アソシエイトID: kokeniwa-22
 */

const ASSOCIATE_ID = "kokeniwa-22";
const AMAZON_JP = "https://www.amazon.co.jp";
const AMAZON_COM = "https://www.amazon.com";

/**
 * ASINからAmazonアフィリエイトリンクを生成
 */
export function getAmazonLink(asin: string): string {
  return `${AMAZON_JP}/dp/${asin}?tag=${ASSOCIATE_ID}`;
}

/**
 * 本のタイトルと著者からAmazon検索リンクを生成（ASINがない場合のフォールバック）
 * 日本語の邦題+著者名で検索し、該当商品が見つかりやすくする。
 */
export function getAmazonSearchLink(title: string, author: string, titleJa?: string, authorJa?: string): string {
  const jaTitle = titleJa || title;
  const jaAuthor = authorJa || author;
  const query = encodeURIComponent(`${jaTitle} ${jaAuthor}`);
  return `${AMAZON_JP}/s?k=${query}&tag=${ASSOCIATE_ID}`;
}

/**
 * Amazon.com（米国版）で原書（英語版）を検索するリンクを生成。
 * アソシエイトID未設定のためタグ無し。英語タイトル+著者名で検索する。
 */
export function getAmazonComSearchLink(titleEn: string, author: string): string {
  const query = encodeURIComponent(`${titleEn} ${author}`);
  return `${AMAZON_COM}/s?k=${query}`;
}

/**
 * Amazonアソシエイトのアトリビューション文言
 */
export const AMAZON_DISCLAIMER =
  "※Amazonのアソシエイトとして、読書の羅針盤は適格販売により収入を得ています。";
