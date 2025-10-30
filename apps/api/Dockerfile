FROM node:22-alpine AS console-builder

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json ./
COPY console/package.json ./console/
COPY packages/zitadel-proto/package.json ./packages/zitadel-proto/
COPY packages/zitadel-client/package.json ./packages/zitadel-client/

RUN pnpm install --frozen-lockfile

COPY console ./console
COPY packages ./packages
COPY docs/frameworks.json ./docs/frameworks.json

WORKDIR /workspace/packages/zitadel-proto
RUN pnpm build 2>/dev/null || true

WORKDIR /workspace/packages/zitadel-client
RUN pnpm build 2>/dev/null || true

WORKDIR /workspace/console
RUN pnpm build

FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git ca-certificates gcc musl-dev bash

WORKDIR /workspace

COPY go.mod go.sum ./
RUN go mod download

COPY . .

COPY --from=console-builder /workspace/console/dist/console/. ./internal/api/ui/console/static/

RUN go install github.com/rakyll/statik@v0.1.7 && \
    go generate internal/api/ui/login/statik/generate.go && \
    go generate internal/notification/statik/generate.go && \
    go generate internal/statik/generate.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -o .artifacts/bin/linux/amd64/zitadel \
    -ldflags="-s -w" \
    .

FROM debian:latest

RUN apt-get update && apt-get install ca-certificates -y && rm -rf /var/lib/apt/lists/*

COPY --from=builder /workspace/.artifacts/bin/linux/amd64/zitadel /app/zitadel
COPY apps/api/entrypoint.sh /app/entrypoint.sh

RUN useradd -s "" --home / zitadel && \
    chown zitadel /app/zitadel && \
    chmod +x /app/zitadel && \
    chown zitadel /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

WORKDIR /app
ENV PATH="/app:${PATH}"

USER zitadel

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
