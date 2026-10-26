/**
 * description の整合を機械検証する（`npm run build` の後で実行する）。
 *
 * 対象は out/ に出力された全ページ（sitemap に載る743URLと、noindex のタグ／著者ページ）。
 * 1. <meta name="description"> が 60〜135 文字
 * 2. HTML 属性にエスケープした後の長さも 135 文字以下（`&` は `&amp;` になって4文字増える）
 * 3. description がページ間で重複しない
 * 4. ページ直下の JSON-LD ノードが持つ description が meta と完全一致する
 *    （入れ子のエンティティ — Person の著者紹介など — は「ページの説明」ではないので対象外）
 *
 * 使い方: npm run build && npm run verify:descriptions
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const siteOrigin = "https://books.antonbase.com";

const MIN = 60;
const MAX = 135;
const ESCAPES = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };

const chars = (value) => [...value].length;
const escapedLength = (value) => chars(value.replace(/[&"<>]/g, (char) => ESCAPES[char]));

/** meta の content は HTML エスケープされるので、JSON-LD と比べる前に戻す。 */
function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&");
}

function readMetaDescription(html) {
  const match = html.match(/<meta name="description" content="([^"]*)"/);
  return match ? decodeEntities(match[1]) : null;
}

/** <script type="application/ld+json"> を全部読み、配列の直下ノードだけ返す。 */
function readJsonLdTopLevelNodes(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      if (node && typeof node === "object" && !Array.isArray(node)) nodes.push(node);
    }
  }
  return nodes;
}

/** out/ 配下のページ（index.html）を URL に変換して列挙する。 */
function collectPages(directory, pages = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_next") continue;
      collectPages(fullPath, pages);
      continue;
    }
    if (entry.name !== "index.html") continue;
    const relative = path.relative(outDir, fullPath);
    const segments = path.dirname(relative).split(path.sep).filter((segment) => segment && segment !== ".");
    // Next.js が生成するエラーページはページではない
    if (segments[0] === "404" || segments[0] === "_not-found") continue;
    const pathname = segments.length ? `/${segments.join("/")}/` : "/";
    // sitemap は非ASCIIをパーセントエンコードして載せているので、同じ表記に揃える
    pages.push({ file: fullPath, url: `${siteOrigin}${encodeURI(pathname)}` });
  }
  return pages;
}

const sitemapText = fs.readFileSync(path.join(outDir, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);

const failures = [];
const seen = new Map();
const sitemapSeen = new Map();
const nodesWithoutDescription = new Map();
const byLength = [];
let comparedNodes = 0;
let extraPages = 0;

for (const { file, url } of collectPages(outDir)) {
  const inSitemap = sitemapSet.has(url);
  if (!inSitemap) extraPages += 1;
  const html = fs.readFileSync(file, "utf8");

  const meta = readMetaDescription(html);
  if (meta === null) {
    failures.push(`meta description missing: ${url}`);
    continue;
  }

  const length = chars(meta);
  byLength.push({ url, length, escaped: escapedLength(meta), inSitemap });
  if (length < MIN) failures.push(`description under ${MIN} chars (${length}): ${url}`);
  if (length > MAX) failures.push(`description over ${MAX} chars (${length}): ${url}`);
  if (escapedLength(meta) > MAX) {
    failures.push(`description over ${MAX} chars after HTML escaping (${escapedLength(meta)}): ${url}`);
  }

  const previous = seen.get(meta);
  if (previous) failures.push(`duplicate description: ${url} == ${previous}`);
  else seen.set(meta, url);

  if (inSitemap) {
    const previousInSitemap = sitemapSeen.get(meta);
    if (previousInSitemap) failures.push(`duplicate description in sitemap: ${url} == ${previousInSitemap}`);
    else sitemapSeen.set(meta, url);
  }

  const nodes = readJsonLdTopLevelNodes(html);
  const withDescription = nodes.filter((node) => typeof node.description === "string");
  if (withDescription.length === 0) {
    failures.push(`no top-level JSON-LD description: ${url}`);
    continue;
  }
  for (const node of withDescription) {
    comparedNodes += 1;
    if (node.description !== meta) {
      failures.push(
        `json-ld description differs from meta (${node["@type"]}): ${url}\n  meta: ${meta}\n  json: ${node.description}`,
      );
    }
  }

  for (const node of nodes) {
    if (typeof node.description === "string") continue;
    const type = String(node["@type"] ?? "?");
    nodesWithoutDescription.set(type, (nodesWithoutDescription.get(type) ?? 0) + 1);
  }
}

const sorted = [...byLength].sort((a, b) => b.length - a.length);
const longestEscaped = [...byLength].sort((a, b) => b.escaped - a.escaped)[0];
const inSitemapRows = byLength.filter((row) => row.inSitemap);

const summary = {
  sitemap: {
    urls: sitemapUrls.length,
    lengthRange: {
      min: inSitemapRows.length ? Math.min(...inSitemapRows.map((row) => row.length)) : 0,
      max: inSitemapRows.length ? Math.max(...inSitemapRows.map((row) => row.length)) : 0,
    },
    underMin: inSitemapRows.filter((row) => row.length < 60).length,
    overMax: inSitemapRows.filter((row) => row.length > MAX).length,
    overMaxEscaped: inSitemapRows.filter((row) => row.escaped > MAX).length,
    duplicates: sitemapUrls.length - sitemapSeen.size,
  },
  allPages: {
    checked: byLength.length,
    outsideSitemap: extraPages,
    lengthRange: {
      min: sorted.length ? sorted[sorted.length - 1].length : 0,
      max: sorted.length ? sorted[0].length : 0,
    },
    underMin: byLength.filter((row) => row.length < MIN).length,
    overMax: byLength.filter((row) => row.length > MAX).length,
    overMaxEscaped: byLength.filter((row) => row.escaped > MAX).length,
    duplicates: byLength.length - seen.size,
    belowRecommended90: byLength.filter((row) => row.length < 90).length,
  },
  jsonLd: {
    nodesCompared: comparedNodes,
    mismatches: failures.filter((line) => line.startsWith("json-ld description differs")).length,
    longestEscaped: longestEscaped ? { length: longestEscaped.escaped, url: longestEscaped.url } : null,
    topLevelNodesWithoutDescription: Object.fromEntries(nodesWithoutDescription),
  },
  failureCount: failures.length,
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error(failures.slice(0, 30).join("\n"));
  process.exitCode = 1;
}
