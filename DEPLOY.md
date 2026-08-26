# Деплой scheduler-оркестратора на GitVerse

Проект состоит из двух частей:

| Часть      | Технологии                             | Куда публикуется                          |
| ---------- | -------------------------------------- | ----------------------------------------- |
| Backend    | NestJS + Prisma + PostgreSQL + Redis   | Docker-образ в Container Registry GitVerse |
| Frontend   | React 18 + Vite + Apollo Client        | Статика на GitVerse Pages (или Docker)     |

## 1. Публикация в Container Registry GitVerse

### 1.1 Создайте репозиторий и включите CI/CD

1. Загрузите проект в репозиторий на [gitverse.ru](https://gitverse.ru).
2. Откройте **Настройки → Репозиторий** и включите тумблер **CI/CD**.
3. Убедитесь, что выбран приоритет пути `.gitverse/workflows` (или оставьте единственный вариант).

### 1.2 Создайте токен доступа

1. В профиле GitVerse откройте **Управление токенами**.
2. Сгенерируйте токен с правами чтения/записи пакетов и репозитория.
3. Сохраните значение — оно понадобится в секретах.

### 1.3 Добавьте секреты репозитория

В **Настройки → Репозиторий → Секреты** добавьте:

| Секрет             | Значение                                                    |
| ------------------ | ----------------------------------------------------------- |
| `GITVERSE_USERNAME` | Ваш логин на GitVerse (например, `ivanov`)                 |
| `GITVERSE_TOKEN`    | Токен из п. 1.2 (используется как пароль для docker login) |

Workflow `.gitverse/workflows/docker-publish.yml` автоматически:

- собирает образ **backend** (`gitverse.ru/<username>/scheduler-backend:latest`);
- собирает образ **frontend** (`gitverse.ru/<username>/scheduler-web:latest`);
- публикует статику frontend на **GitVerse Pages**.

### 1.4 Вручную (опционально)

```bash
docker login -u <username> gitverse.ru
docker build -t gitverse.ru/<username>/scheduler-backend:latest .
docker push gitverse.ru/<username>/scheduler-backend:latest

docker build -t gitverse.ru/<username>/scheduler-web:latest ./web
docker push gitverse.ru/<username>/scheduler-web:latest
```

## 2. Публикация frontend на GitVerse Pages

1. Откройте **Настройки → Страницы**.
2. Включите Pages и выберите источник **Воркфлоу**.
3. При push в `main` workflow загрузит статику из `web/dist` и опубликует сайт.

> Если frontend на Pages работает с backend, развёрнутым не на том же домене,
> при сборке задайте переменную окружения:
> `VITE_GRAPHQL_URL=https://<host-backend>/graphql`
> (см. `web/src/apollo.ts`).

## 3. Запуск Docker-образов (рантайм)

Образы хранятся в реестре GitVerse, но их запуск происходит на выбранной
платформе. Варианты:

### Вариант A — Cloud.ru (Container Apps)

Официальная интеграция GitVerse + Cloud.ru. Workflow для деплоя описан в
документации:
<https://gitverse.ru/docs/cicd/manuals/deployment/cloud-ru/>

Требует:
- аккаунт Cloud.ru;
- секреты `CLOUD_RU_REGISTRY`, `CLOUD_RU_USERNAME`, `CLOUD_RU_PASSWORD`, `CLOUD_RU_PROJECT_ID`.

### Вариант B — VPS с Docker (любой хостинг)

```bash
# на сервере с Docker и docker-compose
docker pull gitverse.ru/<username>/scheduler-backend:latest
docker pull gitverse.ru/<username>/scheduler-web:latest
docker compose up -d
```

`docker-compose.yml` поднимет Postgres, Redis, backend и frontend (nginx)
на одном хосте. Переменные окружения для backend:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/scheduler?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3000
```

### Вариант C — Render / Railway / Fly.io

- Загрузите проект в GitHub/GitLab и создайте сервис из Dockerfile.
- Для PostgreSQL/Redis используйте бесплатные managed-сервисы
  (на Render — бесплатный PostgreSQL, Redis — через Upstash).
- Frontend-образ (`scheduler-web`) отдаёт статику через nginx и проксирует
  `/graphql` на backend.

## 4. Проверка

- Backend: `GET /health` → `{"status":"ok"}`.
- Frontend: `GET /` → HTML приложения.
- GraphQL: `POST /graphql` → `{ jobs { id key name } }`.

## Локальный запуск (для разработки)

```bash
docker compose up --build
# frontend:  http://localhost:8080
# backend:   http://localhost:3000/graphql
```
