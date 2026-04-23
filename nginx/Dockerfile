# Dockerfile
FROM nginx:alpine

# 安装 certbot 及相关依赖
RUN set -ex; \
    # 启用 community 仓库（certbot 在 community 仓库中）
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories; \
    apk update && apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    openssl \
    curl \
    dcron; \
    # 尝试通过apk安装certbot，如果失败则使用pip安装
    if apk add --no-cache certbot 2>/dev/null; then \
        echo "certbot installed via apk"; \
    else \
        echo "certbot not available in apk, installing via pip"; \
        pip3 install --no-cache-dir certbot; \
    fi; \
    rm -rf /var/cache/apk/*

# 创建必要的目录
RUN mkdir -p /etc/letsencrypt && \
    mkdir -p /var/www/certbot && \
    mkdir -p /etc/nginx/ssl && \
    mkdir -p /usr/local/scripts && \
    mkdir -p /etc/nginx/conf.d


# 复制证书管理脚本
COPY scripts/ /usr/local/scripts/
RUN chmod +x /usr/local/scripts/*.sh

# 设置证书自动续期（每天凌晨2点检查）
RUN echo "0 2 * * * /usr/local/scripts/renew-cert.sh >> /var/log/cert-renew.log 2>&1" > /etc/crontabs/root

# 复制默认的SSL参数配置
COPY conf.d/ssl-params.conf /etc/nginx/conf.d/ssl-params.conf

# 暴露端口
EXPOSE 80
EXPOSE 443

# 启动服务
CMD sh -c 'crond && nginx -g "daemon off;"'