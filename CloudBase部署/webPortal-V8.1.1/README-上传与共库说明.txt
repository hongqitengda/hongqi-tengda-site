CloudBase webPortal V8.0.5 官网与小程序客户中心完整兼容版

部署：上传 ZIP 到 webPortal，保存并安装依赖。普通云函数入口 index.main；HTTP 云函数使用 scf_bootstrap。

环境变量：JWT_SECRET、QYWX_WEBHOOK_URL、ALLOWED_ORIGINS=https://www.hongqitengda.com、NODE_ENV=production；JWT_EXPIRES_IN 可省略，默认 30d。

共用数据库：customers、customer_accounts、account_memberships、customer_transactions、requirements、orders，以及小程序客户中心使用的 projects、quotes、deliveries、after_sales、contracts、notifications、invoice_titles、project_messages。

新增客户中心接口：dashboard、list、listAccounts、switchAccount、wallets、members、projectDetail、projectMessages、sendProjectMessage、createAfterSales、invoiceTitles、saveInvoiceTitle、confirmOrderPrice、requestPriceRevision。

注意：本包是云函数后端。官网页面要显示成与小程序 client-home 相同的客户中心，还需要同步修改官网前端 HTML/CSS/JS。
