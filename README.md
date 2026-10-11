# ТИУ Медиатека — фронтенд

React 19 · react-router · TanStack Query · zustand · SCSS-модули · FSD (границы слоёв проверяет ESLint).
Типы API генерируются из OpenAPI бэкенда.

## Запуск

```bash
cp .env.example .env
npm install
npm run dev            # http://localhost:5173 (бэкенд: tiu.media-hub, docker compose up -d)
npm run api:types      # перегенерировать типы после изменения API
npm run typecheck && npm run lint && npm run build
```

Dev-пользователи Keycloak: `ivanov/ivanov`, `petrova/petrova`, `admin/admin` (администратор).

## Структура

- `app` — провайдеры, роутер, layout
- `pages` — коллекции, коллекция, актив, редактор, настройки коллекции, поиск, словарь тегов
- `widgets` — сайдбар, очередь загрузок, просмотрщик и инспектор актива
- `features` — загрузка, правка актива, версии, редактор изображений, водяной знак, схема метаданных, участники
- `entities` — session (Keycloak PKCE), collection, asset, user
- `shared` — API-клиент, UI-кит (glassmorphism, светлая/тёмная тема), утилиты
