# @crm/customer-form

Общая форма клиента для host и MFE-remotes: разметка, лейблы и валидация
в одном месте. Убирает дрейф двух копий (слайдовер хоста и диалог remote).

## Состав

- `CustomerForm.vue` (`@crm/customer-form/CustomerForm.vue`) — тело формы:
  аватар, 5 полей с лейблами, кнопка сохранения. Обёртка диалога
  (USlideover хоста / Dialog remote) — снаружи, у вызывающей стороны.
- `CustomerTable.vue` (`@crm/customer-form/CustomerTable.vue`) — таблица:
  заголовок, состояния загрузки/пустоты, 7 колонок (включая контактное
  лицо). Выбор строки — событием `select`. Фолбэк аватара — слот
  `avatar-fallback` (иконки различаются: Nuxt-Icon vs lucide).
- `schemas` (`@crm/customer-form/schemas`) — zod-правила
  (`createCustomerFormSchemas(labels)`), зеркало backend UpdateCustomerDto.
- `types` (`@crm/customer-form/types`) — `CustomerFormLabels`,
  `CustomerFormAvatarLabels`, `CustomerFormCustomer`, лимиты
  `CUSTOMER_FORM_LIMITS`.

## Правила (как у ui-kit)

- Без Nuxt/i18n-зависимостей: все строки — пропсом `labels`
  (host маппит из `useI18n`, remote — из своих STRINGS).
- HTTP наружу событиями: `save(payload)` (пейлоад уже нормализован:
  trim, пустое → null), `upload-avatar(dataUrl)` / `remove-avatar`.
  Владельцем `avatarUrl` остаётся родитель.
- Иконка кнопки аватара различается (Nuxt-Icon vs lucide) —
  обязательный скоупед-слот `avatar-icon` (`{ saving: boolean }`).
- Классы Tailwind обязаны быть в CSS хоста (remote пользуется его
  сборкой). Хост регистрирует пакет директивой `@source`
  в `app/assets/css/tailwind.css`.
- Версия `vue` — peer (`^3.5.0`), синхронно с host и remotes (правило №1).
  `@tanstack/vue-form`/`zod` бандлятся каждой стороной отдельно —
  через границу федерации компонент не шарится, только исходник.
