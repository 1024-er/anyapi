# Dockerfile
FROM nginx:alpine

# 安装 certbot 及相关依赖
RUN set -ex; \
    # 首先更新镜像源
    echo "https://mirrors.aliyun.com/alpine/latest-stable/main/" > /etc/apk/repositories; \
    echo "https://mirrors.aliyun.com/alpine/latest-stable/community/" >> /etc/apk/repositories; \
    # 安装基础依赖
    apk update && apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    openssl \
    curl \
    tzdata \
    shadow \
    su-exec \
    dcron \
    libffi-dev \
    python3-dev \
    openssl-dev \
    gcc \
    musl-dev \
    libc-dev \
    make; \
    # 升级 pip
    pip3 install --upgrade pip setuptools wheel; \
    # 通过 pip 安装 certbot
    pip3 install certbot certbot-nginx; \
    # 创建 certbot 符号链接（确保在 PATH 中）
    ln -s /usr/bin/python3 /usr/bin/python; \
    # 清理缓存
    rm -rf /var/cache/apk/* /tmp/* /root/.cache

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