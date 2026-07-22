webPortal V8.1.0

新增 generateRequirementDocuments 接口：
- 根据 AI、计算模拟、分析表征在线表单生成 Word。
- Word 上传至 generated/requirements/。
- 配置 PDF_CONVERTER_URL 后调用 /convert 生成 PDF。

部署：覆盖原 webPortal 代码，云端安装依赖；保留原 JWT_SECRET、JWT_EXPIRES_IN、CLOUDBASE_ENV_ID、QYWX_WEBHOOK_URL，并新增 PDF_CONVERTER_URL。
