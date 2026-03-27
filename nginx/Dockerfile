# Nginx 镜像内安装 certbot（非宿主机）：签发/续期在容器内完成，证书输出到挂载的 ./nginx/certs
FROM nginx:stable

RUN apt-get update \
    && apt-get install -y --no-install-recommends certbot openssl bash ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/certbot-lib.sh /usr/local/lib/certbot-lib.sh
COPY scripts/renew-cert.sh /usr/local/bin/renew-cert
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh /usr/local/bin/renew-cert

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
