# 部署和使用指南
## 1. 创建项目目录结构
mkdir -p project/nginx/{certs,conf.d,scripts}
mkdir -p project/{anyapi,docs,logs}
cd project

## 2. 创建并放置上述所有配置文件
## 3. 在anyapi/和docs/目录中放入您的网站文件

## 4. 给脚本添加执行权限
chmod +x nginx/scripts/*.sh

## 5. 构建并启动容器
docker-compose up -d --build

## 6. 进入容器申请初始证书
docker exec -it nginx-anyapi /bin/sh
## 在容器内执行:
/usr/local/scripts/init-cert.sh

## 7. 检查证书状态
docker exec nginx-anyapi certbot certificates

# 验证证书安装

## 1. 检查证书文件
ls -la nginx/certs/live/

## 2. 测试HTTPS访问
curl -I https://www.anyapi.pro
curl -I https://docs.anyapi.pro

## 3. 查看证书信息
openssl s_client -connect www.anyapi.pro:443 -servername www.anyapi.pro < /dev/null 2>/dev/null | openssl x509 -noout -dates

# 常用管理命令

## 1. 手动续期证书
docker exec nginx-anyapi certbot renew --force-renewal

## 2. 测试续期（不实际执行）
docker exec nginx-anyapi certbot renew --dry-run

## 3. 查看证书详情
docker exec nginx-anyapi certbot certificates

## 4. 重新加载Nginx配置
docker exec nginx-anyapi nginx -s reload

## 5. 测试Nginx配置
docker exec nginx-anyapi nginx -t

## 6. 查看容器日志
docker-compose logs -f nginx-certbot

## 7. 进入容器
docker exec -it nginx-anyapi /bin/sh

## 8. 重启服务
docker-compose restart

# 快速重新部署
#!/bin/bash
#deploy.sh - 一键重新部署脚本
docker-compose down
docker-compose build --no-cache
docker-compose up -d
sleep 5
docker exec nginx-anyapi /usr/local/scripts/init-cert.sh

# 高级配置选项
## 环境变量配置 (.env文件)
EMAIL=admin@anyapi.pro
DOMAINS=www.anyapi.pro,docs.anyapi.pro
TZ=Asia/Shanghai
LETSENCRYPT_ENV=production  # 或 staging 用于测试
## Docker Compose 更新配置
#在docker-compose.yml中添加环境变量文件
environment:
  - TZ=${TZ}
  - EMAIL=${EMAIL}
  - DOMAINS=${DOMAINS}
  - LETSENCRYPT_ENV=${LETSENCRYPT_ENV:-production}
env_file:
  - .env

# 测试环境配置
#使用Let's Encrypt测试环境（不限制申请次数）
docker exec nginx-anyapi certbot certonly --test-cert --standalone \
    -d www.anyapi.pro \
    -d anyapi.pro \
    --email admin@anyapi.pro \
    --agree-tos \
    --non-interactive
# 故障排查
## 常见问题及解决方案：
证书申请失败
检查域名DNS解析是否正确
确保80端口可以从外部访问
查看日志：docker-compose logs nginx-certbot
Nginx启动失败
检查配置文件语法：docker exec nginx-anyapi nginx -t
确保证书文件存在
查看错误日志：tail -f logs/error.log
证书续期失败
检查cron服务是否运行：docker exec nginx-anyapi crond status
手动运行续期脚本测试
检查证书是否即将过期
HTTPS无法访问
检查防火墙设置
验证证书链：openssl s_client -connect domain:443 -showcerts
检查Nginx配置中的证书路径

# docker 命令
1. 删除容器
docker rm <容器ID或名称>：删除一个已停止的容器。
docker rm -f <容器ID或名称>：强制删除一个运行中的容器。
docker container prune：一键删除所有已停止的容器。
2. 删除镜像
docker rmi <镜像ID或名称>：删除指定的镜像。
docker image prune：删除所有未被容器使用的悬空镜像。
docker image prune -a：删除所有未被任何容器使用的镜像（请谨慎使用）。
3. 删除卷
docker volume rm <卷名>：删除指定的卷。
docker volume prune：删除所有未被容器引用的卷。
一键清理所有未使用的资源

执行 docker system prune，它会默认删除已停止的容器、未被使用的网络和所有悬空镜像。如果希望同时删除未被任何容器使用的卷和镜像，请使用：

docker system prune -a --volumes
请注意：prune和 -a、--volumes等命令会永久删除数据，请务必确认这些资源不再需要后再执行。