import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "search-indexing.config.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/$/, "");

function urlFor(relative) {
  if (!relative || relative === "index.html") return `${siteUrl}/`;
  return `${siteUrl}/${relative.split("/").map(encodeURIComponent).join("/")}`;
}

function changedPaths() {
  const before = process.env.BEFORE_SHA || "";
  const after = process.env.AFTER_SHA || "HEAD";
  if (!/^[0-9a-f]{40}$/i.test(before) || /^0+$/.test(before)) return [];
  try {
    return execFileSync("git", ["diff", "--name-only", before, after], { cwd: root, encoding: "utf8" })
      .split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  } catch (error) {
    console.warn(`Unable to read changed paths; submitting the sitemap set: ${error.message}`);
    return [];
  }
}

function sitemapUrls() {
  const xml = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

const changed = changedPaths();
let urls;
if (changed.length) {
  const paths = changed.filter((item) => item.endsWith(".html") && !config.excludePrefixes.some((prefix) => item === prefix || item.startsWith(prefix)));
  urls = [...new Set([...config.corePaths.map(urlFor), ...paths.map(urlFor)])];
} else {
  urls = [...new Set([...config.corePaths.map(urlFor), ...sitemapUrls()])];
}
urls = urls.filter((url) => url.startsWith(`${siteUrl}/`)).slice(0, 10000);

async function submitIndexNow() {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: config.host,
      key: config.indexNowKey,
      keyLocation: `${siteUrl}/${config.indexNowKey}.txt`,
      urlList: urls
    })
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}: ${await response.text()}`);
  console.log(`IndexNow accepted ${urls.length} URLs (HTTP ${response.status}).`);
}

async function submitBaidu() {
  const token = process.env.BAIDU_TOKEN?.trim();
  if (!token) {
    console.log("BAIDU_TOKEN is not configured; Baidu API submission was skipped.");
    return;
  }
  const endpoint = `https://data.zz.baidu.com/urls?site=${encodeURIComponent(siteUrl)}&token=${encodeURIComponent(token)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "text/plain; charset=utf-8" },
    body: urls.join("\n")
  });
  const result = await response.text();
  if (!response.ok) throw new Error(`Baidu returned HTTP ${response.status}: ${result}`);
  console.log(`Baidu accepted the submission request: ${result}`);
}

const results = await Promise.allSettled([submitIndexNow(), submitBaidu()]);
for (const result of results) {
  if (result.status === "rejected") {
    console.error(result.reason?.message || result.reason);
    process.exitCode = 1;
  }
}
