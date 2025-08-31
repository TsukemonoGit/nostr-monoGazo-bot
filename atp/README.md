````md
# BOT 実行環境 (Raspberry Pi + Docker + Supervisor)

このドキュメントは、Go 言語の BOT を **Raspberry Pi** 上で Docker コンテナと Supervisor を使用して実行する方法、  
および **Windows** 上で実行ファイルをビルドして動作させる方法をまとめたものです。

**注意:** Docker の権限エラーが発生する場合は、コマンドの前に `sudo` を付けて実行するか、またはユーザーを `docker` グループに追加してください。

---

## 開発用コンテナ操作 (Raspberry Pi)

### ビルド

```bash
docker build -t atp-dev .
docker compose build
```
````

### コンテナに入って作業

```bash
# 新規起動してシェルに入る
docker compose run --rm app bash

# 既に起動中なら
docker compose exec app bash
```

### Go 実行 (開発時)

```bash
# 依存取得 (初回のみ)
go mod download

# 実行
go run main.go
```

---

## 本番実行 (Raspberry Pi, Supervisor 管理)

### バイナリのビルド (Raspberry Pi 用)

Docker コンテナ内で Raspberry Pi (Linux/arm64) 用の実行ファイルを作成する。

```bash
# コンテナに入る
docker run -it --rm -v ${PWD}:/app atp-dev bash

# /app でビルド
cd /app
GOOS=linux GOARCH=arm64 go build -o bot main.go
exit
```

生成された `bot` がホスト (Raspberry Pi) 側に保存される。

### Supervisor 設定

`/etc/supervisor/conf.d/bot.conf` に以下を記述する。

```ini
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

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start bot
```

Raspberry Pi 起動時に自動で常駐起動される。

---

## Windows 実行

### バイナリのビルド (Windows 用)

Raspberry Pi 上または他の Linux 上でクロスコンパイル可能。

```bash
# Windows (64bit) 向け exe 出力
GOOS=windows GOARCH=amd64 go build -o bot.exe main.go
```

その他のターゲット例:

```bash
# Windows 32bit
GOOS=windows GOARCH=386 go build -o bot.exe main.go

# Windows ARM64
GOOS=windows GOARCH=arm64 go build -o bot.exe main.go
```

生成された `bot.exe` を Windows にコピーして実行する。

---

## 運用まとめ

- **開発**: Docker コンテナ内で `go run main.go`
- **Raspberry Pi 本番稼働**: `GOOS=linux GOARCH=arm64` でビルド → Supervisor で常駐管理
- **Windows 実行**: `GOOS=windows GOARCH=...` でクロスコンパイルした `.exe` を配布
- Go コンパイラは Raspberry Pi 本体にインストール不要

```

この README の形でよいですか、それとも **Windows 上でも Supervisor 相当の常駐管理方法** を追記しますか?
```
