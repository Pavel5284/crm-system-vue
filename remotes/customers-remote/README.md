# customers-remote (пилот MFE, вариант B)

Самодостаточный раздел «Клиенты»: таблица + слайдовер. Чистый Vite+Vue,
`ssr` нет сознательно — remote живёт только на клиенте и монтируется
хостом внутри `<ClientOnly>`.

## Команды

```bash
# из корня crm-system-vue
corepack pnpm install
corepack pnpm --filter @crm/customers-remote dev     # playground на :4174
corepack pnpm --filter @crm/customers-remote build   # dist/remoteEntry.js
corepack pnpm --filter @crm/customers-remote preview # раздача dist на :4174
```

Dev хоста ожидает remote на `http://localhost:4174/remoteEntry.js`
(перекрывается env `NUXT_PUBLIC_MFE_CUSTOMERS_REMOTE_URL`).

## Контракт

Пропсы `CustomersPage` — `CustomersPageProps` из `@crm/mfe-contracts`
(`apiBaseUrl`, `locale`). Remote НЕ использует Nuxt-автоимпорты хоста
(`useI18n`, `useQuery`, Pinia-сторы, `@nuxt/ui`): всё нужное приходит
пропсами. Изменение API — сначала в `packages/mfe-contracts`, потом здесь.

## Версионирование (правило №3)

Никогда не указывайте «плавающий» URL ремоута в хосте.

**Vercel (текущий сетап):** оба проекта смотрят на один репозиторий
с Root Directory = корень `crm-system-vue` (иначе `workspace:*`-зависимость
`@crm/mfe-contracts` не резолвится при установке):

- Проект remote: Framework `Other`,
  Build Command `pnpm --filter @crm/customers-remote build`,
  Output Directory `remotes/customers-remote/dist`,
  env `VITE_API_BASE_URL=https://crm-api-gateway-zyrg.onrender.com/api`.
  CORS-заголовки для `remoteEntry.js`/чанков уже лежат в корневом
  `vercel.json` (заскоуплены на `/remoteEntry.js` и `/assets/*` —
  хост эти пути не раздаёт, конфликтов нет).
- В хосте пинайте **deployment-URL** (`https://customers-remote-<hash>.vercel.app/remoteEntry.js`),
  а не production-алиас. Обновление — отдельным изменением env в хосте + Redeploy.

**VPS (будущее):** раздавать `dist/` по пути `/mfe/customers/vX.Y.Z/remoteEntry.js`,
в хосте — полный версионированный путь. Откат = вернуть предыдущий URL.

## Откат при битой сборке

1. Remote упал — хост в режиме `auto` сам показывает локальную реализацию,
   в режиме `remote` — экран `RemoteUnavailable` с кнопкой повтора. Остальной CRM работает.
2. Полный откат: в хосте вернуть предыдущий `NUXT_PUBLIC_MFE_CUSTOMERS_REMOTE_URL`
   (или `NUXT_PUBLIC_MFE_CUSTOMERS=local`) и передеплоить только хост. Remote не трогаем.

## Правила shared-зависимостей (правило №1)

`vue: { singleton: true, requiredVersion: '^3.5.0' }` — версия обязана совпадать
с хостом (`crm-system-vue/package.json`). Обновления Vue — синхронно в обоих
проектах (Renovate/Dependabot group). Разъехались миноры — два инстанса Vue
и «странные баги реактивности».
