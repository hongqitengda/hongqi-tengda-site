# V19.2 上传 GitHub Pages 步骤

本版本包含 1700 多个静态页面，不建议在 GitHub 网页中逐个拖拽上传。推荐使用 **GitHub Desktop**。

## 方法一：GitHub Desktop（推荐）

1. 打开 GitHub Desktop，登录你的 GitHub 账号。
2. 选择 `File → Clone repository`，克隆当前官网仓库到电脑。
3. 打开克隆后的本地仓库文件夹。
4. 先备份旧版本，然后删除旧网站文件；不要删除本地隐藏的 `.git` 文件夹。
5. 将本压缩包解压后的全部内容复制到仓库根目录，包括：
   - `.nojekyll`
   - `CNAME`
   - `index.html`
   - `assets/`
   - `project/`
   - `category/`
   - `board/`
   - `sitemap.xml`
6. 回到 GitHub Desktop，在 Summary 中填写：`Deploy V19.2 static SEO site`。
7. 点击 `Commit to main`，再点击 `Push origin`。
8. 打开仓库 `Settings → Pages`，确认发布来源为：
   - Source：`Deploy from a branch`
   - Branch：`main`
   - Folder：`/ (root)`
9. 自定义域名应保持为 `www.hongqitengda.com`，并勾选 HTTPS（域名解析生效后）。

## 方法二：Git 命令行

先克隆现有仓库：

```bash
git clone 你的GitHub仓库地址
cd 仓库文件夹
```

将本版本全部文件复制到该仓库根目录后运行：

```bash
git add .
git commit -m "Deploy V19.2 static SEO site"
git push origin main
```

不要使用 `git push --force`，避免覆盖不应删除的提交历史。

## 发布后检查

依次打开：

```text
https://www.hongqitengda.com/
https://www.hongqitengda.com/catalog.html
https://www.hongqitengda.com/category/index.html
https://www.hongqitengda.com/project/sim-0001.html
https://www.hongqitengda.com/sitemap.xml
```

确认：

- 首页和原有栏目正常；
- 项目查询显示 1612 项；
- 搜索、分类、价格筛选和分页正常；
- 项目卡片可进入独立详情页；
- 企业微信二维码正常；
- 手机端底部显示快捷咨询栏。
