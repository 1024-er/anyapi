#!/bin/bash
# nginx/scripts/renew-cert.sh
# 证书自动续期脚本

set -e

echo "=========================================="
echo "开始检查证书续期"
echo "时间: $(date)"
echo "=========================================="

# 检查证书是否需要续期
if certbot renew --dry-run; then
    echo "检测到证书需要续期，开始续期..."
    
    # 停止Nginx
    echo "停止Nginx..."
    nginx -s stop
    sleep 2
    
    # 续期证书
    echo "正在续期证书..."
    certbot renew --force-renewal \
        --pre-hook "echo '续期前准备...'" \
        --post-hook "echo '续期后处理...'" \
        --renew-hook "nginx"
    
    # 重新启动Nginx
    echo "重新启动Nginx..."
    nginx
    
    # 创建证书软链接
    echo "更新证书链接..."
    for domain in www.anyapi.pro docs.anyapi.pro; do
        if [ -d "/etc/letsencrypt/live/$domain" ]; then
            ln -sf /etc/letsencrypt/live/$domain /etc/nginx/ssl/live/ 2>/dev/null || \
            cp -r /etc/letsencrypt/live/$domain /etc/nginx/ssl/live/
        fi
    done
    
    # 重新加载Nginx配置
    nginx -s reload
    
    echo "✅ 证书续期成功！"
else
    echo "✅ 证书未过期，跳过续期"
fi

echo "=========================================="
echo "证书状态:"
certbot certificates
echo "=========================================="