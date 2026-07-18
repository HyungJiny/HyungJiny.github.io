# HyungJiny.github.io

* page : https://HyungJiny.github.io
* theme : https://github.com/mmistakes/jekyll-theme-basically-basic

## 로컬에서 미리보기 (Docker)

로컬에 Ruby를 설치할 필요 없이 Docker로 실행합니다.

```bash
docker compose up --build
```

빌드가 끝나면 브라우저에서 http://localhost:4000 으로 접속합니다.
소스(`*.md`, `_config.yml` 등)를 수정하면 자동으로 다시 빌드됩니다.

종료하려면 `Ctrl+C`, 정리하려면:

```bash
docker compose down
```

> `_config.yml`을 변경한 경우에는 컨테이너를 재시작해야 반영됩니다.
