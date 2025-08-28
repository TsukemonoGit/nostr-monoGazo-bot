docker build -t atp-dev .
docker-compose build
docker-compose run --rm app bash

docker run -it --rm -v ${PWD}:/app atp-dev

# サービス起動してシェルで入る

docker-compose run --rm app bash

# または既に起動中なら

docker-compose exec app bash

go run main.go

# コンテナ内で

go mod download # 初回のみ
go run main.go
