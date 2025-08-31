FROM golang:1.24-alpine

RUN apk add --no-cache git bash vim

WORKDIR /app

# go.mod があればコピーして依存取得
COPY go.mod go.sum ./
RUN go mod download || true

# ソースコードと data ディレクトリをコピー
COPY main.go ./
COPY data ./data

# コンテナ起動時にシェルで入る
CMD ["bash"]