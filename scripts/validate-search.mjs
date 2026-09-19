import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "search-indexing.config.json"), "utf8"));
const failures = [];

function requireFile(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) failures.push(`Missing ${relative}`);
  return absolute;
}

const robotsPath = requireFile("robots.txt");
const sitemapPath = requireFile("sitemap.xml");
const llmsPath = requireFile("llms.txt");
const aiIndexPath = requireFile("ai-index.json");
const keyPath = requireFile(`${config.indexNowKey}.txt`);

if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  for (const required of ["OAI-SearchBot", "GPTBot", "Bytespider", `${config.siteUrl}/sitemap.xml`]) {
    if (!robots.includes(required)) failures.push(`robots.txt is missing ${required}`);
  }
}

if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  if (!xml.startsWith("<?xml")) failures.push("sitemap.xml has no XML declaration");
  if (urls.length < 20) failures.push(`sitemap.xml contains only ${urls.length} URLs`);
  if (new Set(urls).size !== urls.length) failures.push("sitemap.xml contains duplicate URLs");
  if (!urls.includes(`${config.siteUrl}/`)) failures.push("sitemap.xml is missing the homepage");
  if (urls.some((url) => url.includes("customer-portal") || url.includes("CloudBase"))) failures.push("sitemap.xml exposes an excluded path");
}

if (fs.existsSync(llmsPath) && !fs.readFileSync(llmsPath, "utf8").includes("上海红祺腾达信息技术有限公司")) failures.push("llms.txt has no organization identity");
if (fs.existsSync(aiIndexPath)) {
  try { JSON.parse(fs.readFileSync(aiIndexPath, "utf8")); }
  catch (error) { failures.push(`ai-index.json is invalid: ${error.message}`); }
}
if (fs.existsSync(keyPath) && fs.readFileSync(keyPath, "utf8").trim() !== config.indexNowKey) failures.push("IndexNow key file does not match the configuration");

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("Search and AI discovery files passed validation.");
