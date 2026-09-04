import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const sitemapPath = path.join(outDir, "sitemap.xml");
const sitemapText = fs.readFileSync(sitemapPath, "utf8");
const sitemapUrls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
const failures = [];

function htmlPathForUrl(url) {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  return path.join(outDir, ...segments, "index.html");
}

function readRobots(html) {
  return html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
}

function readCanonical(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
}

for (const url of sitemapUrls) {
  const file = htmlPathForUrl(url);
  if (!fs.existsSync(file)) {
    failures.push(`sitemap file missing: ${url}`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  if (readCanonical(html) !== url) failures.push(`canonical mismatch: ${url}`);
  if (readRobots(html).includes("noindex")) failures.push(`sitemap URL is noindex: ${url}`);
}

for (const kind of ["tags", "authors"]) {
  const directory = path.join(outDir, kind);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const file = path.join(directory, slug, "index.html");
    const html = fs.readFileSync(file, "utf8");
    const url = `https://books.antonbase.com/${kind}/${encodeURIComponent(slug)}/`;
    const robots = readRobots(html);
    const noindex = robots.includes("noindex");
    if (html.includes("NEXT_HTTP_ERROR_FALLBACK;404")) failures.push(`${kind} route rendered 404: ${slug}`);
    if (readCanonical(html) !== url) failures.push(`${kind} canonical mismatch: ${slug}`);
    if (noindex && !robots.includes("follow")) failures.push(`${kind} noindex must keep follow: ${slug}`);
    if (noindex === sitemapSet.has(url)) {
      failures.push(`${kind} sitemap/robots disagreement: ${slug}`);
    }
  }
}

const internalRouteViolations = [];
function walkHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(fullPath);
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const html = fs.readFileSync(fullPath, "utf8");
    for (const match of html.matchAll(/(?:href|action)="(\/[^"]*)"/g)) {
      const route = match[1].split(/[?#]/, 1)[0];
      if (route !== "/" && !route.endsWith("/") && !path.extname(route)) {
        internalRouteViolations.push(`${fullPath}: ${route}`);
      }
    }
  }
}
walkHtml(outDir);
if (internalRouteViolations.length) failures.push(...internalRouteViolations);

const summary = {
  sitemapUrls: sitemapUrls.length,
  sitemapDuplicates: sitemapUrls.length - sitemapSet.size,
  failureCount: failures.length,
  internalRouteViolations: internalRouteViolations.length,
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error(failures.slice(0, 20).join("\n"));
  process.exitCode = 1;
}
