import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "search-indexing.config.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/$/, "");

function walk(directory, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const relative = path.posix.join(prefix, entry.name);
    if (config.excludePrefixes.some((item) => relative === item || relative.startsWith(item))) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute, relative));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(relative);
  }
  return files;
}

function gitDates() {
  const dates = new Map();
  try {
    const output = execFileSync(
      "git",
      ["log", "--format=__DATE__%cs", "--name-only", "--no-renames", "--", "*.html"],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    let currentDate = "";
    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.startsWith("__DATE__")) currentDate = line.slice(8);
      else if (line.endsWith(".html") && currentDate && !dates.has(line)) dates.set(line, currentDate);
    }
  } catch (error) {
    console.warn(`Unable to read Git history; using file dates: ${error.message}`);
  }
  return dates;
}

function previousDates() {
  const dates = new Map();
  const sitemapPath = path.join(root, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return dates;
  const xml = fs.readFileSync(sitemapPath, "utf8");
  for (const match of xml.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<\/url>/gs)) {
    dates.set(match[1], match[2]);
  }
  return dates;
}

function xmlEscape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

const historyDates = gitDates();
const oldDates = previousDates();
const today = new Date().toISOString().slice(0, 10);
const urls = [];

for (const relative of walk(root).sort((a, b) => a.localeCompare(b, "en"))) {
  const html = fs.readFileSync(path.join(root, relative), "utf8");
  if (/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html) ||
      /<meta\b[^>]*\bcontent=["'][^"']*noindex[^"']*["'][^>]*\bname=["']robots["']/i.test(html)) continue;

  const canonicalMatch = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i) ||
    html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i);
  let url;
  if (canonicalMatch) {
    try {
      const parsed = new URL(canonicalMatch[1], `${siteUrl}/`);
      if (parsed.host !== config.host || parsed.protocol !== "https:") continue;
      parsed.hash = "";
      parsed.search = "";
      url = parsed.href;
    } catch {
      continue;
    }
  } else {
    url = relative === "index.html" ? `${siteUrl}/` : `${siteUrl}/${relative.split("/").map(encodeURIComponent).join("/")}`;
  }

  const statDate = fs.statSync(path.join(root, relative)).mtime.toISOString().slice(0, 10);
  const lastmod = historyDates.get(relative) || oldDates.get(url) || statDate || today;
  urls.push({ url, lastmod });
}

const unique = new Map();
for (const item of urls) unique.set(item.url, item);
const ordered = [...unique.values()].sort((a, b) => a.url.localeCompare(b.url, "en"));
const body = ordered.map(({ url, lastmod }) =>
  `  <url>\n    <loc>${xmlEscape(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap.xml with ${ordered.length} canonical public URLs.`);
