高端材料表征｜全站同步最终覆盖包

使用方法：
1. GitHub Desktop 先 Fetch / Pull。
2. 解压本包。
3. 将包内文件按原目录直接复制到 hongqi-tengda-site 根目录，选择覆盖。
4. 回 GitHub Desktop 查看 Changes，Commit，Push。

本版不需要 PowerShell，不需要 PATCHES，不需要手工找 HTML 插入点。

已同步：
- 中英文高端材料表征专题页；
- 全站顶部导航：在“材料表征 / 环境检测（Characterization & Testing）”后加入“高端表征 / Advanced Characterization”；
- 全站页脚服务导航同步加入专题；
- 表征&检测 Board：先完整展示“高端材料表征与原位分析”，其完整结束后才进入“环境代表性检测项目”；
- Catalog：自动加载中英文高端表征检索；
- 中文 / 英文同步；
- 保留现有网站其他栏目，不删除原来的环境检测与材料表征内容。

说明：
全站入口通过网站已经统一加载的 assets/js/bilingual-navigation.js 实现，因此不需要逐个修改几十个 HTML 页面。
