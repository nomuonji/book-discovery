/**
 * ページ種別ごとの description 組み立て。
 *
 * 方針:
 * - 画面に出ている事実（冊数・著者・国・出版年・収録作の書名・読書パス）だけを使う。
 * - データに無い経歴・生没年・評価は足さない。
 * - 90〜135文字に収める。単位は文（。区切り）で、途中で切らない。
 * - 同じ文が2ページに出ないよう、各ページ固有の値（名前・書名・冊数）を先頭文に入れる。
 */

import type { Book, ReadingPath } from "@/types";
import { getAllAuthors, getAllPaths, getRecommendationsForAuthor } from "@/lib/data";

export const DESCRIPTION_MIN = 90;
export const DESCRIPTION_MAX = 135;

const SENTENCE_END = /[。！？]/;
const NOISE = /[。「」、！？——・…\s]/g;

export function charLength(value: string): number {
  return [...value].length;
}

/** -512 → 紀元前512年（画面の年表記に合わせる） */
export function yearLabel(year: number): string {
  return year < 0 ? `紀元前${-year}年` : `${year}年`;
}

/** slug から決まる 0-999 の値。並び順の揺らぎにだけ使い、内容は変えない。 */
function hashSlug(slug: string): number {
  let h = 7;
  for (const ch of slug) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 100003;
  return h;
}

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let current = "";
  for (const ch of text) {
    current += ch;
    if (SENTENCE_END.test(ch)) {
      out.push(current);
      current = "";
    }
  }
  if (current.trim()) out.push(current);
  return out
    .map((sentence) => sentence.replace(/\s+/g, "").trim())
    .filter((sentence) => sentence.length > 0);
}

function normalizeForCompare(text: string): string {
  return text.replace(NOISE, "");
}

/** すでに入れた文とほぼ同じ内容か（4文字の重複率60%以上） */
function isRedundant(candidate: string, accumulated: string): boolean {
  const target = normalizeForCompare(candidate);
  if (!target) return true;
  const pool = normalizeForCompare(accumulated);
  if (pool.includes(target)) return true;
  const size = 4;
  let total = 0;
  let hit = 0;
  for (let i = 0; i + size <= target.length; i++) {
    total += 1;
    if (pool.includes(target.slice(i, i + size))) hit += 1;
  }
  return total > 0 && hit / total >= 0.6;
}

/**
 * 文の配列から、上限を超えない範囲で順に連結する。
 * 90文字に届かない場合だけ extras（より一般的な締めの文）を足す。
 * 1文も丸ごと入らないときは、そのページの主要事実が入らないので空文字を返す。
 */
export function composeDescription(
  core: (string | undefined | null)[],
  extras: (string | undefined | null)[] = [],
): string {
  let result = "";
  const used = new Set<number>();

  for (let i = 0; i < core.length; i++) {
    const sentence = core[i];
    if (!sentence) continue;
    if (charLength(result + sentence) > DESCRIPTION_MAX) continue;
    if (result && isRedundant(sentence, result)) {
      used.add(i);
      continue;
    }
    result += sentence;
    used.add(i);
  }

  if (charLength(result) < DESCRIPTION_MIN) {
    for (let i = 0; i < extras.length; i++) {
      const sentence = extras[i];
      if (!sentence) continue;
      if (charLength(result) >= DESCRIPTION_MIN) break;
      if (charLength(result + sentence) > DESCRIPTION_MAX) continue;
      if (isRedundant(sentence, result)) continue;
      result += sentence;
    }
  }

  return trimDanglingEnd(result);
}

/** データ由来の文が助詞で終わっている場合、末尾の1文を落として読み終わりを整える。 */
const DANGLING_END = /(を|が|は|に|で|と|の|も|から|まで|より|、|へ)。$/;

function trimDanglingEnd(text: string): string {
  let current = text;
  while (DANGLING_END.test(current)) {
    const sentences = splitSentences(current);
    if (sentences.length < 2) break;
    const candidate = sentences.slice(0, -1).join("");
    if (charLength(candidate) < DESCRIPTION_MIN) break;
    current = candidate;
  }
  return current;
}

/**
 * 本文の冒頭 max 文字以内で、最後の「。」までで切る。
 * 文末まで残した結果が MIN 未満になる場合は空文字を返し、呼び出し側で組み立て直す。
 */
export function clipToSentenceEnd(text: string, max: number): string {
  const chars = [...text.replace(/\s+/g, "")];
  if (chars.length <= max) return chars.join("");
  const head = chars.slice(0, max);
  for (let i = head.length - 1; i >= 0; i--) {
    if (SENTENCE_END.test(head[i])) {
      const candidate = head.slice(0, i + 1).join("");
      return charLength(candidate) >= DESCRIPTION_MIN ? candidate : "";
    }
  }
  return "";
}

// ---------------------------------------------------------------- タグページ

export function tagDescription(tag: string, books: Book[]): string {
  const total = books.length;
  const authors = [...new Set(books.map((book) => book.authorJa))];
  const countries = [...new Set(books.map((book) => book.country.split("/")[0]))];
  const years = books.map((book) => book.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const span = `${yearLabel(firstYear)}〜${yearLabel(lastYear)}`;

  const countryPart =
    countries.length === 1
      ? countries[0]
      : countries.length === 2
        ? `${countries[0]}・${countries[1]}`
        : `${countries[0]}・${countries[1]}ほか${countries.length - 2}か国`;

  const [first, second, third] = books;
  const sample =
    second === undefined
      ? `${first.titleJa}（${first.authorJa}）`
      : `${first.titleJa}（${first.authorJa}）、${second.titleJa}（${second.authorJa}）`;

  const h = hashSlug(tag);
  const leads = [
    `「${tag}」の本は${total}冊。`,
    `テーマ「${tag}」に当たる本が${total}冊。`,
    `「${tag}」で絞ると${total}冊。`,
    `${tag}を扱った本は${total}冊。`,
  ];
  const mains = [
    `${countryPart}の${authors.length}人による${span}の作品を、著者・国・出版年から絞り込めます。`,
    `${sample}を入口に、${countryPart}・${authors.length}人の著者の作品を国と出版年でたどれます。`,
    `${span}、${countryPart}の${authors.length}人の著者による作品を一覧できます。`,
    `${sample}から入り、${countryPart}の${authors.length}人の著者を${span}の範囲でたどれます。`,
  ];

  return composeDescription([
    leads[h % leads.length],
    mains[h % mains.length],
    `${sample}から読み始められます。`,
    // 冒頭文に年代が入っていないときだけ、年代の文を足す
    mains[h % mains.length].includes(span) ? "" : `扱う年代は${span}です。`,
    authors.length > 2 ? `著者は${authors[0]}、${authors[1]}ほか計${authors.length}人。` : "",
    third ? `ほかに${third.titleJa}（${third.authorJa}）なども収録。` : "",
  ]);
}

// ---------------------------------------------------------------- 著者ページ

interface AuthorForDescription {
  slug: string;
  name: string;
  nameJa: string;
  country: string;
  books: Book[];
  readingPaths?: { bookSlug: string }[];
}

export function authorDescription(author: AuthorForDescription): string {
  const total = author.books.length;
  const signatureFromPath = author.readingPaths
    ?.map((item) => item.bookSlug)
    .map((slug) => author.books.find((book) => book.slug === slug))
    .find((book): book is Book => Boolean(book));
  const signature = signatureFromPath ?? author.books[0];

  const themes = [...new Set(author.books.flatMap((book) => book.tags))].slice(0, 3);
  const themeText = themes.join("・");

  const pathsWithAuthor = getAllPaths().filter((path) =>
    path.steps.some((step) => author.books.some((book) => book.slug === step.bookSlug)),
  );
  const firstPath = pathsWithAuthor[0];
  const firstPathOrder = firstPath
    ? firstPath.steps.find((step) => author.books.some((book) => book.slug === step.bookSlug))?.order
    : undefined;

  const recommendations = getRecommendationsForAuthor(author.name);
  const recommendationCount = recommendations.length;
  const recommendationLead = recommendations[0]?.book.titleJa;
  const sameCountry = getAllAuthors().filter(
    (other) => other.slug !== author.slug && other.country === author.country,
  ).length;
  const years = author.books.map((book) => book.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const primaryCountry = author.country.split("/")[0];

  const h = hashSlug(author.slug);
  const leads = [
    `${author.nameJa}（${author.country}）の収録${total}冊。`,
    `${author.country}の作家、${author.nameJa}の収録${total}冊。`,
    `${author.nameJa}の本は${total}冊。`,
    `${author.nameJa}（${author.country}）の作品${total}冊を一覧に。`,
    `${author.country}の${author.nameJa}の収録${total}冊。`,
  ];
  const signatures = [
    `${signature.titleJa}（${yearLabel(signature.year)}）を入口に、${themeText}のテーマをたどれます。`,
    `${signature.titleJa}（${yearLabel(signature.year)}）から読み始められます。`,
    `代表作${signature.titleJa}（${yearLabel(signature.year)}）と、${themeText}のテーマから読む順番を作れます。`,
    `${signature.titleJa}（${yearLabel(signature.year)}）を軸に、${themeText}のテーマと次に読む一冊が分かります。`,
    `${themeText}のテーマから、${signature.titleJa}（${yearLabel(signature.year)}）を入口に選べます。`,
  ];
  const sameCountrySentences = [
    `同じ${primaryCountry}の著者はほか${sameCountry}人を収録。`,
    `同じ${primaryCountry}の作家は、ほかに${sameCountry}人います。`,
    `${primaryCountry}の著者はほか${sameCountry}人。`,
  ];
  const closers = [
    `「${signature.titleJa}」の次に読む一冊も掲載しています。`,
    `「${signature.titleJa}」から次の一冊へ進める導線を置いています。`,
    `「${signature.titleJa}」の読む順番とあわせて一覧できます。`,
  ];

  return composeDescription(
    [
      leads[h % leads.length],
      signatures[h % signatures.length],
      firstPath && firstPathOrder
        ? `読書パス「${firstPath.titleJa}」の${firstPathOrder}冊目にも入っています。`
        : "",
      recommendationCount >= 2 && recommendationLead
        ? `収録作からは「${recommendationLead}」など${recommendationCount}冊へ推薦がつながります。`
        : "",
      sameCountry > 0 && !author.country.includes("/") ? sameCountrySentences[h % sameCountrySentences.length] : "",
      total > 1
        ? `${yearLabel(firstYear)}から${yearLabel(lastYear)}までの${total}冊です。`
        : `${yearLabel(signature.year)}の一冊です。`,
      closers[h % closers.length],
    ],
    [`作品ごとの読む理由を添えています。`],
  );
}

// ---------------------------------------------------------------- 書籍詳細

/** candidate の 4文字片のうち base に含まれる割合。言い換えの重複度を見るのに使う。 */
function overlapRatio(candidate: string, base: string): number {
  const target = normalizeForCompare(candidate);
  const pool = normalizeForCompare(base);
  if (!target) return 1;
  let total = 0;
  let hit = 0;
  for (let i = 0; i + 4 <= target.length; i++) {
    total += 1;
    if (pool.includes(target.slice(i, i + 4))) hit += 1;
  }
  return total === 0 ? 1 : hit / total;
}

export function bookDescription(book: Book, nextBook?: Book, path?: ReadingPath): string {
  const h = hashSlug(book.slug);
  // 「選書理由」と「なぜ読むべきか」は内容が近いことがあるので、
  // 本文と重ならないほうを1つだけ選ぶ（同じことを二度言わせない）。
  const secondary = [book.whyReadJa, book.selectionReasonJa]
    .filter((text): text is string => Boolean(text))
    .map((text) => ({ text, overlap: overlapRatio(text, book.descriptionJa) }))
    .sort((a, b) => a.overlap - b.overlap)[0];
  const pathOrder = path?.steps.find((step) => step.bookSlug === book.slug)?.order;
  const closers = [
    `${book.country}、${yearLabel(book.year)}の作品。`,
    `テーマは${book.tags.slice(0, 2).map((tag) => `「${tag}」`).join("")}。`,
  ];

  return composeDescription(
    [
      ...splitSentences(book.descriptionJa),
      ...(secondary ? splitSentences(secondary.text) : []),
      path && pathOrder ? `読書パス「${path.titleJa}」の${pathOrder}冊目です。` : "",
      nextBook ? `読み終えたら次は「${nextBook.titleJa}」（${nextBook.authorJa}）です。` : "",
      closers[h % closers.length],
    ],
    [`書影と読む理由つきで紹介しています。`],
  );
}

// ---------------------------------------------------------------- 読書パス詳細

export function pathDescription(
  path: ReadingPath,
  stepsWithBooks: { order: number; book: Book }[],
): string {
  const first = stepsWithBooks[0];
  const last = stepsWithBooks[stepsWithBooks.length - 1];
  const h = hashSlug(path.slug);
  const count = stepsWithBooks.length;
  const tails = first && last
    ? [
        `全${count}冊、${first.book.titleJa}から${last.book.titleJa}へ読み進めます。`,
        `全${count}冊を${first.book.titleJa}から${last.book.titleJa}まで順にたどります。`,
        `${first.book.titleJa}を1冊目に、${last.book.titleJa}まで${count}冊を順にたどります。`,
      ]
    : [];
  const closers = [
    `各ステップには読む理由と掴むべき概念を添えています。`,
    `1冊ごとに読む理由と掴むべき概念を添えました。`,
    `各章に読む理由と掴むべき概念を付けています。`,
  ];

  return composeDescription(
    [...splitSentences(path.descriptionJa), tails[h % tails.length], closers[h % closers.length]],
    [`読む順番と、そこで掴む概念を一覧できます。`],
  );
}
