# GitHub Desktop 无冲突上传步骤

本压缩包不包含 `.git`，不要把它作为新的 Git 仓库添加。

1. 如果 GitHub Desktop 正显示 Merge 冲突，先点击 **Abort merge**。
2. 在 GitHub Desktop 中重新克隆网站仓库：
   - File → Clone repository
   - 选择或输入 `hongqitengda/hongqi-tengda-site`
   - 克隆到一个新的空文件夹。
3. 解压本压缩包。
4. 将解压后文件夹内的全部文件和文件夹复制到刚克隆的仓库根目录。
5. 出现同名文件时选择“替换目标中的文件”。
6. 返回 GitHub Desktop，填写 Summary 后点击 **Commit to main**。
7. 点击 **Push origin**。

注意：不要复制任何旧版本的 `.git` 文件夹；不要点击 Force push；不要在冲突窗口中逐个合并这四个文件。
