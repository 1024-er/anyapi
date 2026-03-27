# anyapi 主程序（www.anyapi.pro）：内嵌 web 前端 + API。生产环境建议在宿主机用 Nginx 反代 HTTPS 到 127.0.0.1:3000
FROM oven/bun:latest AS builder

# 降低 Vite/Rollup 并行度与进程数，减轻 Docker 构建时 OOM（宿主机可在 Docker Desktop 里调高内存上限）
ENV VITE_LOW_MEMORY=1 \
    GOMAXPROCS=2

WORKDIR /build
COPY web/package.json .
COPY web/bun.lock .
RUN bun install
COPY ./web .
COPY ./VERSION .
RUN DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat VERSION) bun run build

FROM golang:alpine AS builder2
ENV GO111MODULE=on CGO_ENABLED=0

ARG TARGETOS
ARG TARGETARCH
ENV GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64}
ENV GOEXPERIMENT=greenteagc

WORKDIR /build

ADD go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=builder /build/dist ./web/dist
RUN go build -ldflags "-s -w -X 'github.com/QuantumNous/new-api/common.Version=$(cat VERSION)'" -o anyapi

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata libasan8 wget \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

COPY --from=builder2 /build/anyapi /
EXPOSE 3000
WORKDIR /data
ENTRYPOINT ["/anyapi"]
