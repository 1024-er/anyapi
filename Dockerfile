# anyapi 主程序（www.anyapi.pro）：内嵌 web 前端 + API
# 前端构建改用 node（bun 在低内存 VPS 上 OOM 137）
FROM node:22-bookworm-slim AS builder

ENV VITE_LOW_MEMORY=1

WORKDIR /build
COPY web/package.json web/bun.lock ./
RUN npm install --legacy-peer-deps
COPY ./web .
COPY ./VERSION .
RUN DISABLE_ESLINT_PLUGIN='true' \
    VITE_REACT_APP_VERSION=$(cat VERSION) \
    NODE_OPTIONS="--max-old-space-size=1536" \
    npx vite build

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
