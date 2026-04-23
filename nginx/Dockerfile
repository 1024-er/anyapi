# Dockerfile
FROM nginx:alpine

# 安装 certbot 及相关依赖
RUN apk add --no-cache \
    certbot \
    python3 \
    py3-pip \
    bash \
    openssl \
    curl \
    cronie && \
    pip3 install --upgrade pip && \
    pip3 install certbot-nginx && \
    rm -rf /var/cache/apk/*

# 创建必要的目录
RUN mkdir -p /etc/letsencrypt && \
    mkdir -p /var/www/certbot && \
    mkdir -p /etc/nginx/ssl && \
    mkdir -p /usr/local/scripts

# 复制证书管理脚本
COPY nginx/scripts/ /usr/local/scripts/
RUN chmod +x /usr/local/scripts/*.sh

# 设置证书自动续期（每天凌晨2点检查）
RUN echo "0 2 * * * /usr/local/scripts/renew-cert.sh >> /var/log/cert-renew.log 2>&1" > /etc/crontabs/root

# 复制默认的SSL参数配置
COPY nginx/ssl-params.conf /etc/nginx/conf.d/ssl-params.conf

# 暴露端口
EXPOSE 80
EXPOSE 443

# 启动服务
CMD sh -c 'cron && nginx -g "daemon off;"'