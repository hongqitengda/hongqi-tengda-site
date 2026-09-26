# 红祺腾达官网：搜索引擎与 AI 检索自动运行说明

## 上传后自动生效的内容

1. `robots.txt` 开放公共页面给百度、Google、Bing 及 AI 搜索抓取，同时排除客户门户和部署文件。
2. `llms.txt` 与 `ai-index.json` 提供统一的公司身份、业务范围、关键词和重点页面，便于 AI 工具理解与引用。
3. `sitemap.xml` 由脚本自动扫描公开 HTML 页面、读取 canonical、排除 `noindex` 与非公开目录，并保留每页更新时间。
4. IndexNow 密钥文件和自动提交流程用于通知 Bing 及其他支持 IndexNow 的搜索引擎。
5. 每次向 `main` 或 `master` 分支上传 HTML 后，GitHub Actions 会自动：
   - 重新生成 Sitemap；
   - 校验 robots、Sitemap、AI 索引和 IndexNow 密钥；
   - 提交新增/更新 URL 到 IndexNow；
   - 若配置了百度推送密钥，同时自动推送百度。

## 上传方法

把更新包解压后，将其中全部文件和文件夹按原目录上传到官网仓库根目录。必须保留：

- `.github/workflows/search-indexing.yml`
- `scripts/`
- `robots.txt`
- `llms.txt`
- `ai-index.json`
- `search-indexing.config.json`
- `b98fc0a9597a2587c8eea98c03b05485.txt`
- `sitemap.xml`

上传完成后，在 GitHub 仓库的 **Actions** 页面查看 `Search and AI discovery`。第一次可点 `Run workflow` 手动运行一次；以后每次新增或修改 HTML 页面都会自动运行。

## 一次性平台设置

### 百度搜索资源平台

1. 添加 `https://www.hongqitengda.com` 并完成站点验证。
2. 提交 `https://www.hongqitengda.com/sitemap.xml`。
3. 在“普通收录 → API 提交”复制接口中的 `token`。
4. GitHub 仓库进入 `Settings → Secrets and variables → Actions → New repository secret`。
5. 名称填写 `BAIDU_TOKEN`，值填写百度提供的 token。

此后百度 URL 推送自动运行。不要把百度 token 直接写入网页或提交到仓库。

### Google Search Console

1. 添加网域资源 `hongqitengda.com`，按 Google 提示在域名 DNS 中加入 TXT 验证记录。
2. 验证后提交 `https://www.hongqitengda.com/sitemap.xml`。

Google 对普通网页没有通用的自动 URL 推送接口；完成一次验证和 Sitemap 提交后，后续由 Google 自动抓取更新后的 Sitemap。

### Bing Webmaster Tools

1. 添加 `https://www.hongqitengda.com`，可以直接从 Google Search Console 导入，或单独完成验证。
2. 提交 `https://www.hongqitengda.com/sitemap.xml`。

即使暂未登录 Bing 后台，更新包中的 IndexNow 也会自动向 Bing 及其他参与平台发送新增/更新 URL。

## 关于 ChatGPT、DeepSeek 与豆包

- ChatGPT：`robots.txt` 已明确允许 `OAI-SearchBot`、`GPTBot` 与 `ChatGPT-User`，并提供 Sitemap、结构化数据和 AI 可读摘要。
- DeepSeek、豆包：公共页面在通用 `User-agent: *` 下开放，同时加入常见 AI 抓取标识；平台若调整抓取标识，通用开放规则仍然有效。
- AI 工具是否展示或引用某个网站由平台自身决定，无法保证立即收录或固定排名。持续发布具有真实问题、方法、案例和结论的原创页面，才是长期提高引用率的核心。

## 日常维护

以后只需要正常新增或修改 HTML 页面并上传。不要手工改 `sitemap.xml`；自动流程会更新它。若更换主域名或 IndexNow 密钥，只修改 `search-indexing.config.json`，并同步更新对应密钥文本文件。
