#!/bin/bash
# 手动续期（容器内 certbot，证书同步到 /etc/nginx/certs/<域名>/）
#
#   docker compose exec nginx renew-cert
#   docker compose exec nginx renew-cert --force
#
# 宿主机未安装 certbot 时，一律在容器内执行上述命令即可。
set -e

# shellcheck source=/dev/null
source /usr/local/lib/certbot-lib.sh
certbot_init_paths

FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --force|-f)
      FORCE=1
      shift
      ;;
    -h|--help)
      echo "用法: renew-cert [--force]"
      echo "  --force  使用 certonly --force-renewal 强制续期本域名证书"
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      exit 1
      ;;
  esac
done

echo "[renew-cert] 域名=${CERTBOT_DOMAIN} webroot=${WEBROOT}"

set +e
if [ "${FORCE}" -eq 1 ]; then
  echo "[renew-cert] 强制续期…"
  certbot certonly \
    --webroot -w "${WEBROOT}" \
    -d "${CERTBOT_DOMAIN}" \
    --force-renewal \
    --non-interactive
else
  certbot renew \
    --webroot -w "${WEBROOT}" \
    --non-interactive \
    --cert-name "${CERTBOT_DOMAIN}" 2>/dev/null || \
  certbot renew \
    --webroot -w "${WEBROOT}" \
    --non-interactive
fi
RC=$?
set -e

if [ "${RC}" -ne 0 ]; then
  echo "[renew-cert] certbot 退出码 ${RC}" >&2
fi

if certbot_copy_le_to_nginx; then
  nginx -s reload
  echo "[renew-cert] 完成：已同步证书并 nginx reload"
else
  echo "[renew-cert] 同步失败：请确认 Let’s Encrypt 已成功签发 ${CERTBOT_DOMAIN}" >&2
  exit 1
fi
