CloudBase webPortal V8.0.7｜项目页极简下单与快速提交版

主要变化：
1. 官网项目页允许未登录客户直接提交，联系人和手机号为必要信息。
2. 使用相同手机号/邮箱时，订单自动关联已有官网/小程序客户账户。
3. 提交接口只等待数据库写入，不再等待企业微信 Webhook，显著降低“正在提交”停留时间。
4. 附件改为订单创建成功后逐个上传；失败不影响订单本身。
5. 未登录客户可凭订单记录中的联系方式上传附件，避免强制先进入客户中心。
6. 管理员更新订单状态时，自动写入 notifications，客户可在客户中心“消息中心”查看状态通知。
7. 客户中心仍与小程序共用 customers、customer_accounts、requirements、orders 等数据库集合。

部署：
- 覆盖原 webPortal 云函数代码。
- Node.js 18 或 20。
- 入口 index.main。
- 选择“云端安装依赖”。
- 保留 JWT_SECRET、CLOUDBASE_ENV_ID、ALLOWED_ORIGINS、WECOM_WEBHOOK_URL 等原环境变量。
- 部署后访问 health，确认 version 为 8.0.7。
