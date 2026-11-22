# 联机排行榜

GitHub Pages 继续提供页面；此目录只部署排行榜 API 到 Cloudflare Workers，数据保存在 D1。前端仅配置公开接口地址，没有 Cloudflare Token。

## 已部署地址

https://chongjie-arcade-leaderboard.hongjie-i-github-io.workers.dev

前端已配置此地址。GitHub Pages 需要发布本次前端修改后，线上主页才会使用联机排行榜。

## 部署

需要 Node.js 22.12 或更新版本和 Cloudflare 账号。先在本目录执行 `npm ci`、`npm test`。

1. 使用官方 OAuth 登录：

   ```sh
   npx wrangler login --use-keyring --scopes account:read user:read workers:write workers_scripts:write d1:write
   ```

2. 创建独立数据库：

   ```sh
   npx wrangler d1 create arcade-leaderboard
   ```

   将返回的 `database_id` 填进 `wrangler.jsonc` 的 D1 绑定。多账号时还需在配置中指定目标 `account_id`。

3. 创建表并部署：

   ```sh
   npm run migrate:remote
   npm run deploy
   ```

4. 把部署输出的 HTTPS `workers.dev` 根地址填入 `static/games/leaderboard-config.js` 的 `apiBase`，然后按原来的流程更新 GitHub Pages。无需迁移网站或改 DNS。

`ALLOWED_ORIGINS` 已包含现有正式域名、GitHub Pages 域名和本机 Hugo 预览地址。换域名时同步更新此设置。只允许指定来源通过浏览器提交；CORS 本身不是身份认证。

## 行为与范围

- 每个浏览器生成一个随机标识，数据库只存其 SHA-256；公开接口只返回昵称、最高分和时间。同名访客可以并存，不代表已验证身份。
- 2048 成绩可附带最大方块，并与该次最高分一起保存、展示。
- 每个游戏、每个浏览器保留最高分；低分不会覆盖高分。相同提交 ID 可安全重试，修改后的重复请求会被拒绝。
- 查询前十名，缓存约 5 秒；前端在排行榜可见时每 20 秒刷新，提交成功后强制刷新。
- 联机故障时明确显示云端缓存或本机记录；提交失败可手动重试。不会自动上传历史本机成绩。
- 有昵称长度、游戏和分数范围校验、请求体限制与 Cloudflare 位置级限频。前端报分仍可被修改，属于休闲排行榜，不能用于有奖竞技。
- 本机收藏图册、赛道最佳用时仍保存在浏览器；本服务仅同步玩家主动提交的游戏成绩。
- 无需付费套餐即可先试用；访问量增长时检查 Workers、D1 的免费额度。

## 本地验证

```sh
npm run migrate:local
npm run dev
```

将前端 `apiBase` 临时设为本地 Worker 地址即可联调，发布前换回 HTTPS 地址。`npm test` 使用真实 Workers 模拟器及 D1 SQL 执行，包括并发、重复提交、来源限制和限频场景。
