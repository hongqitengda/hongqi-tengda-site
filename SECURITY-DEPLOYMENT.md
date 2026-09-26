# GitHub Pages 安全部署说明

此目录只包含可公开访问的静态官网文件，可上传至 GitHub Pages。

禁止上传以下内容：
- 公众号 AppSecret、微信开放平台 AppSecret；
- 企业微信群机器人 Webhook；
- 腾讯云 SecretId / SecretKey；
- `.env`、`.env.*`；
- CloudBase 云函数代码或部署目录；
- 私钥、证书和数据库导出文件。

官网只通过公开 HTTPS 地址调用 `webPortal`，不会也不应持有任何服务器端密钥。
