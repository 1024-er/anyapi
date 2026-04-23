#!/bin/bash
# nginx/scripts/init-cert.sh
# 初始化证书申请脚本

set -e

echo "=========================================="
echo "开始申请SSL证书"
echo "时间: $(date)"
echo "=========================================="

# 从环境变量获取邮箱
EMAIL="${EMAIL:-admin@anyapi.pro}"
DOMAINS="${DOMAINS:-www.anyapi.pro,docs.anyapi.pro}"

echo "使用邮箱: $EMAIL"
echo "域名列表: $DOMAINS"

# 创建必要的目录
mkdir -p /var/www/certbot
mkdir -p /etc/nginx/ssl/live
mkdir -p /var/log/letsencrypt

# 停止Nginx以便certbot可以监听80端口
echo "停止Nginx以申请证书..."
nginx -s stop 2>/dev/null || true
sleep 2

# 申请www.anyapi.pro证书（包含主域名和www）
echo "正在申请 www.anyapi.pro 证书..."
certbot certonly --standalone \
    -d www.anyapi.pro \
    -d anyapi.pro \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http \
    --logs-dir /var/log/letsencrypt

# 申请docs.anyapi.pro证书
echo "正在申请 docs.anyapi.pro 证书..."
certbot certonly --standalone \
    -d docs.anyapi.pro \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http \
    --logs-dir /var/log/letsencrypt

# 创建证书软链接到Nginx的ssl目录
echo "创建证书链接..."
if [ -d "/etc/letsencrypt/live/www.anyapi.pro" ]; then
    ln -sf /etc/letsencrypt/live/www.anyapi.pro /etc/nginx/ssl/live/ 2>/dev/null || \
    cp -r /etc/letsencrypt/live/www.anyapi.pro /etc/nginx/ssl/live/
fi

if [ -d "/etc/letsencrypt/live/docs.anyapi.pro" ]; then
    ln -sf /etc/letsencrypt/live/docs.anyapi.pro /etc/nginx/ssl/live/ 2>/dev/null || \
    cp -r /etc/letsencrypt/live/docs.anyapi.pro /etc/nginx/ssl/live/
fi

# 重新启动Nginx
echo "重新启动Nginx..."
nginx

# 测试Nginx配置
if nginx -t; then
    echo "✅ Nginx配置测试成功"
else
    echo "❌ Nginx配置测试失败"
    exit 1
fi

echo "=========================================="
echo "证书申请完成！"
echo "证书位置: /etc/nginx/ssl/live/"
echo "证书续期命令: docker exec nginx-anyapi certbot renew"
echo "手动测试续期: docker exec nginx-anyapi certbot renew --dry-run"
echo "=========================================="

# 显示证书信息
echo "证书信息:"
for domain in www.anyapi.pro docs.anyapi.pro; do
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        echo "=== $domain ==="
        echo "有效期: $(openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)"
    fi
done