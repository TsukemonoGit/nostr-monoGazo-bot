# BOT 実行環境 (Raspberry Pi + Docker + Supervisor)

このドキュメントは、Raspberry Pi 上で Go 言語の BOT を Docker コンテナと Supervisor を使用して実行するための手順をまとめたものです。
**注意:** Docker の権限エラーが発生する場合は、コマンドの前に `sudo` を付けて実行するか、またはユーザーを `docker` グループに追加してください。

## 開発用コンテナ操作

このセクションでは、開発中に Docker コンテナを操作する方法を説明します。

### ビルド

Docker イメージとサービスをビルドします。

```

docker build -t atp-dev .
docker compose build

```

### コンテナに入って作業

コンテナ内で開発作業を行うための方法です。

```

# 新規起動してシェルに入る

docker compose run --rm app bash

# 既に起動中なら

docker compose exec app bash

```

### Go 実行 (開発時)

コンテナ内で Go プログラムを実行する手順です。

```

# 依存取得 (初回のみ)

go mod download

# 実行

go run main.go

```

## 本番実行 (Supervisor 管理)

このセクションでは、ビルドしたバイナリを Supervisor で管理して本番環境で実行する方法を説明します。

### バイナリのビルド (コンテナ内で実施)

Raspberry Pi 上で実行可能なバイナリを Docker コンテナ内でビルドします。

```

# コンテナに入る

docker run -it --rm -v ${PWD}:/app atp-dev bash

# /app でビルド

cd /app
go build -o bot main.go
exit

```

ビルド成果物 `bot` がホスト (Raspberry Pi) 側のカレントディレクトリに出力されます。

### Supervisor 設定

`/etc/supervisor/conf.d/bot.conf` を作成し、以下の内容を記述します。

```

[program:bot]
directory=/home/pi/atp        ; ソースコード/バイナリ配置ディレクトリ
command=/home/pi/atp/bot
autostart=true
autorestart=true
stderr\_logfile=/var/log/bot.err.log
stdout\_logfile=/var/log/bot.out.log
user=pi
environment=PATH="/usr/bin:/bin"

```

### 反映と起動

Supervisor の設定を反映させ、BOT を起動します。

```

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start bot

```

Raspberry Pi 起動時に自動で `bot` が常駐起動されます。

## 運用

- 開発時は Docker コンテナで編集・テスト (`go run main.go`)

- 本番稼働はコンテナでビルドしたバイナリを Raspberry Pi に配置し、Supervisor 管理で常時稼働

- Go コンパイラは Raspberry Pi 本体にインストール不要です。
