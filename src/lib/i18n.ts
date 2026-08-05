/**
 * 国際化ヘルパー
 * 将来的に英語対応（/en 等）を行うための準備。
 * 現在は日本語を既定として、英語フィールドが存在する場合は英語を返す。
 */

export type Locale = "ja" | "en";

export const DEFAULT_LOCALE: Locale = "ja";

/**
 * 本の紹介文をロケールに応じて取得。英語フィールドがなければ日本語にフォールバック。
 */
export function localizedDescription(
  ja: string,
  en: string | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  return locale === "en" && en ? en : ja;
}

/**
 * 本のタイトルをロケールに応じて取得。
 * 英語の場合は原語タイトルを、日本語の場合は邦題を優先。
 */
export function localizedTitle(
  title: string,
  titleJa: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  return locale === "en" ? title : titleJa;
}

/**
 * 著者名をロケールに応じて取得。
 */
export function localizedAuthor(
  author: string,
  authorJa: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  return locale === "en" ? author : authorJa;
}
