#!/bin/bash
set -e

# shellcheck source=/dev/null
source /usr/local/lib/certbot-lib.sh
certbot_init_paths

mkdir -p "${CERT_DIR}" "${WEBROOT}"

ensure_self_signed() {
  if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
    return 0
  fi
  echo "[certbot] ${CERT_DIR} 无证书，生成临时自签名以便 nginx 启动（浏览器会提示不安全，直至 LE 签发成功）…"
  if ! openssl req -x509 -nodes -newkey rsa:2048 -days 90 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${CERTBOT_DOMAIN}" \
    -addext "subjectAltName=DNS:${CERTBOT_DOMAIN}" 2>/dev/null; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 90 \
      -keyout "${CERT_DIR}/privkey.pem" \
      -out "${CERT_DIR}/fullchain.pem" \
      -subj "/CN=${CERTBOT_DOMAIN}"
  fi
}

if certbot_copy_le_to_nginx 2>/dev/null; then
  :
else
  ensure_self_signed
fi

if [ -n "${CERTBOT_EMAIL:-}" ]; then
  if [ "${CERTBOT_STAGING:-0}" = "1" ] || [ "${CERTBOT_STAGING:-}" = "true" ]; then
    echo "[certbot] 警告：CERTBOT_STAGING=1 为测试证书，浏览器会报 ERR_CERT_AUTHORITY_INVALID；正式站请 CERTBOT_STAGING=0"
  fi

  echo "[certbot] 临时启动 nginx（daemon）以完成 HTTP-01…"
  nginx
  sleep 5

  STAGING_ARGS=()
  if [ "${CERTBOT_STAGING:-0}" = "1" ] || [ "${CERTBOT_STAGING:-}" = "true" ]; then
    STAGING_ARGS=(--staging)
    echo "[certbot] 使用 Let's Encrypt Staging"
  fi

  set +e
  if [ -d "${LE_LIVE}" ] && [ -f "${LE_LIVE}/fullchain.pem" ]; then
    echo "[certbot] 尝试续期（若未到期则跳过）…"
    certbot renew --webroot -w "${WEBROOT}" --non-interactive --quiet \
      --cert-name "${CERTBOT_DOMAIN}" 2>/dev/null || \
    certbot renew --webroot -w "${WEBROOT}" --non-interactive --quiet
  else
    echo "[certbot] 首次申请证书：${CERTBOT_DOMAIN}（邮箱：${CERTBOT_EMAIL}）"
    certbot certonly \
      --webroot -w "${WEBROOT}" \
      -d "${CERTBOT_DOMAIN}" \
      --email "${CERTBOT_EMAIL}" \
      --agree-tos \
      --non-interactive \
      --preferred-challenges http \
      "${STAGING_ARGS[@]}"
  fi
  CB_EXIT=$?
  set -e

  if [ "${CB_EXIT}" -eq 0 ]; then
    certbot_copy_le_to_nginx || true
    nginx -s reload
    echo "[certbot] 已复制 Let's Encrypt 证书到 ${CERT_DIR} 并 reload nginx"
  else
    echo "[certbot] 续期/申请失败（退出码 ${CB_EXIT}）。以下为 certbot 日志末尾（若存在）："
    tail -n 100 /var/log/letsencrypt/letsencrypt.log 2>/dev/null || echo "(无日志文件)"
    echo "[certbot] 请检查：DNS 指向本机、80 端口公网可访问、未使用 Staging、且宿主机 shell 未设置空的 CERTBOT_EMAIL（应使用 compose 的 env_file: .env）"
  fi

  nginx -s quit || true
  sleep 1
else
  echo "[certbot] 未设置 CERTBOT_EMAIL（容器环境为空）。请在 .env 中设置 CERTBOT_EMAIL=你的邮箱，并确认 compose 已配置 env_file: .env，然后重启 nginx。"
fi

certbot_report_trust_status || true

echo "[nginx] 以前台方式启动…"
exec "$@"
