CloudBase webPortal V8.0.6
淘宝式直接下单、二进制附件上传与 Word 导出版

一、解决的问题
1. 修复“不支持的 action：uploadAttachment”。
2. 附件不再以 Base64 放入 JSON，改为 application/octet-stream 单文件上传。
3. 单文件主动限制为 5 MB，低于 CloudBase 云函数二进制请求 6 MB 上限。
4. 增加 requestDocumentExport，生成 Word 综合需求单并保存到云存储。
5. createOrder 返回 businessNo/demandNo，便于官网显示批次编号。
6. 兼容原 createRequirement -> submitRequirement 别名。

二、部署
1. 在 CloudBase 控制台打开 webPortal 云函数。
2. 使用本 ZIP 完整覆盖代码。
3. 安装依赖或选择“云端安装依赖”。package.json 新增 docx。
4. 入口保持 index.main；Node.js 18 或更高。
5. 环境变量至少保留：
   CLOUDBASE_ENV_ID=cloud1-d3gji859l94c3e5ec
   JWT_SECRET=请使用随机长字符串
   ALLOWED_ORIGINS=https://www.hongqitengda.com,https://hongqitengda.com
   WECOM_WEBHOOK_URL=原企业微信群机器人地址
6. HTTP 访问路径继续使用 /api/webPortal。
7. 部署后先访问 action=health，确认 version=8.0.6。

三、附件测试
- 登录官网客户中心。
- 选择一个小 PNG/PDF，提交订单。
- 云存储应出现 website-uploads/ 目录。
- 数据库 requirements.attachments 应保存 fileID 和临时 URL。

四、Word 测试
- 下单后点击“下单并生成 Word”。
- 云存储应出现 generated-documents/ 目录。
- requirements 中应写入 documentFileID、documentUrl、documentGeneratedAt。

五、注意
- 官网 V9.2.1 与本包配套部署。
- 不要继续部署旧 V8.0.5，否则仍会显示“不支持的 action：uploadAttachment”。
- 5 MB 以上文件建议拆分压缩包或在小程序中补充。
