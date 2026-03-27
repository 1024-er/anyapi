# 供 entrypoint.sh 与 renew-cert 共用（source 本文件）
# shellcheck shell=bash

certbot_init_paths() {
  export CERTBOT_DOMAIN="${CERTBOT_DOMAIN:-www.anyapi.pro}"
  export CERT_DIR="/etc/nginx/certs/${CERTBOT_DOMAIN}"
  export LE_LIVE="/etc/letsencrypt/live/${CERTBOT_DOMAIN}"
  export WEBROOT="/var/www/certbot"
}

# 将 LE 证书解引用复制到 nginx 目录（跨 bind mount 的符号链接在部分环境下不可靠）
certbot_copy_le_to_nginx() {
  certbot_init_paths
  if [ -f "${LE_LIVE}/fullchain.pem" ] && [ -f "${LE_LIVE}/privkey.pem" ]; then
    mkdir -p "${CERT_DIR}"
    cp -L "${LE_LIVE}/fullchain.pem" "${CERT_DIR}/fullchain.pem.tmp"
    cp -L "${LE_LIVE}/privkey.pem" "${CERT_DIR}/privkey.pem.tmp"
    mv -f "${CERT_DIR}/fullchain.pem.tmp" "${CERT_DIR}/fullchain.pem"
    mv -f "${CERT_DIR}/privkey.pem.tmp" "${CERT_DIR}/privkey.pem"
    chmod 644 "${CERT_DIR}/fullchain.pem" 2>/dev/null || true
    chmod 600 "${CERT_DIR}/privkey.pem" 2>/dev/null || true
    echo "[certbot] 已复制 Let's Encrypt 证书到 ${CERT_DIR}"
    return 0
  fi
  echo "[certbot] 未找到 ${LE_LIVE} 下证书，跳过复制"
  return 1
}

# 打印当前 fullchain 颁发者，并提示浏览器是否可能报 ERR_CERT_AUTHORITY_INVALID
certbot_report_trust_status() {
  certbot_init_paths
  local f="${CERT_DIR}/fullchain.pem"
  if [ ! -f "$f" ]; then
    echo "[certbot] 未找到 ${f}"
    return 1
  fi
  local issuer subject
  issuer=$(openssl x509 -in "$f" -noout -issuer 2>/dev/null || echo "")
  subject=$(openssl x509 -in "$f" -noout -subject 2>/dev/null || echo "")
  echo "[certbot] 当前证书 subject: ${subject}"
  echo "[certbot] 当前证书 issuer:  ${issuer}"
  if echo "$issuer" | grep -qiE "Let's Encrypt"; then
    if echo "$issuer" | grep -qiE "Fake|STAGING|Staging"; then
      echo "[certbot] 警告：此为 Let's Encrypt 测试(Staging)链，浏览器会报 ERR_CERT_AUTHORITY_INVALID。请设 CERTBOT_STAGING=0 并删除 letsencrypt 卷后重新申请正式证书。"
      return 2
    fi
    echo "[certbot] 已为正式 Let's Encrypt 链，浏览器应显示安全锁。"
    return 0
  fi
  echo "[certbot] 警告：非 Let's Encrypt 签发（多为自签名），浏览器会报 net::ERR_CERT_AUTHORITY_INVALID。"
  return 1
}
