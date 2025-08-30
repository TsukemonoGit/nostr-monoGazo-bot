# BOT 実行環境 (Raspberry Pi + Docker + Supervisor)

## 開発用コンテナ操作

### ビルド

```
docker build -t atp-dev .
docker-compose build
```

### コンテナに入って作業

```
# 新規起動してシェルに入る
docker-compose run --rm app bash

# 既に起動中なら
docker-compose exec app bash
```

### Go 実行 (開発時)

```
# 依存取得 (初回のみ)
go mod download

# 実行
go run main.go
```

---

## 本番実行 (Supervisor 管理)

### バイナリのビルド (コンテナ内で実施)

```
# コンテナに入る
docker run -it --rm -v ${PWD}:/app atp-dev bash

# /app でビルド
cd /app
go build -o bot main.go
exit
```

ビルド成果物 `bot` がホスト (Raspberry Pi) 側のカレントディレクトリに出力される。

### Supervisor 設定

`/etc/supervisor/conf.d/bot.conf` を作成:

```
[program:bot]
directory=/home/pi/atp        ; ソースコード/バイナリ配置ディレクトリ
command=/home/pi/atp/bot
autostart=true
autorestart=true
stderr_logfile=/var/log/bot.err.log
stdout_logfile=/var/log/bot.out.log
user=pi
environment=PATH="/usr/bin:/bin"
```

### 反映と起動

```
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start bot
```

Raspberry Pi 起動時に自動で `bot` が常駐起動される。

---

## 運用

- 開発時は Docker コンテナで編集・テスト (`go run main.go`)
- 本番稼働はコンテナでビルドしたバイナリを Raspberry Pi に配置し、Supervisor 管理で常時稼働
- Go コンパイラは Raspberry Pi 本体にインストール不要
