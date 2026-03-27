证书目录（宿主机映射：本仓库 nginx/certs/www.anyapi.pro → 容器 /etc/nginx/certs/www.anyapi.pro）

一、自动申请/续期（推荐）
  在项目根目录 .env 中设置 CERTBOT_EMAIL、可选 CERTBOT_DOMAIN，docker compose up 时
  镜像入口脚本会申请或续期 Let’s Encrypt，并写入本目录。

二、手动续期（容器内 certbot，无需在宿主机安装 certbot）
  确保容器已运行且 80 端口可从公网访问（HTTP-01）：

    docker compose exec nginx renew-cert

  强制续期（忽略「未到期」限制，注意 Let’s Encrypt 频率限制）：

    docker compose exec nginx renew-cert --force

  若使用自定义域名，先 export 再执行：

    docker compose exec -e CERTBOT_DOMAIN=www.anyapi.pro nginx renew-cert

三、宿主机自行安装 certbot（可选）
  若希望在宿主机用 certbot，可自行 apt/yum 安装，申请后将 fullchain.pem / privkey.pem
  复制到本目录，然后：

    docker compose exec nginx nginx -s reload

四、持久化
  /etc/letsencrypt 在 compose 中挂载为卷 letsencrypt，续期状态会保留。

五、仍显示「不安全」时
  - 正式站请确认 CERTBOT_STAGING=0（或未设置）；Staging 证书浏览器一律不信任。
  - 在 .env 中设置 CERTBOT_EMAIL，重启 nginx 容器，查看日志是否出现「已复制 Let's Encrypt 证书」。
  - 若 shell 里曾执行 export CERTBOT_EMAIL=（空值），会覆盖 .env，导致容器内无邮箱、certbot 从不执行。请先执行 unset CERTBOT_EMAIL 再 docker compose up。
  - 确认 DNS 已指向本机，且 80 端口可从公网访问（HTTP-01）。
  - 若曾用自签访问过并启用了 HSTS，请在浏览器中清除该站点的 HSTS 数据或换无痕窗口再试。
