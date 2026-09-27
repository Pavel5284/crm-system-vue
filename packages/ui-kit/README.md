# @crm/ui-kit

Общие презентационные компоненты и утилиты для host и всех remotes
(правило №5: дизайн-система — общий пакет, не федерируется).

## Состав

- `PhoneInput.vue` (`@crm/ui-kit/PhoneInput.vue`) — инпут телефона:
  санитизация ввода, keydown-фильтр, слоты `hint`/`error`.
- `phone` (`@crm/ui-kit/phone`) — утилиты: `sanitizePhoneDisplay`,
  `truncatePhoneDigits`, `normalizePhone`, `phoneToPayload`,
  `handlePhoneInput`, `handlePhoneKeydown`, `isPhoneDisplayValid`.
- `avatar` (`@crm/ui-kit/avatar`) — `AVATAR_MAX_BYTES`,
  `validateAvatarFile` (коды `tooLarge`/`notImage` — маппятся на строки
  вызывающей стороной), `readFileAsDataUrl`, `getInitials`.
- `AvatarUploader.vue` (`@crm/ui-kit/AvatarUploader.vue`) — загрузчик
  аватара: превью/инициалы, выбор файла, удаление, слот ошибки.
  Подписи — пропсом `labels` (дефолт — английский), иконка кнопки —
  скоупед-слот `icon` (`{ saving }`): host кладёт Nuxt-`<Icon>`,
  remote — `lucide`. Состояние — `v-model` + `v-model:saving`,
  события `upload(dataUrl)` / `remove`.

## Правила

- Без Nuxt/i18n-зависимостей: строки локализации (`placeholder`, `hint`,
  `error`) передаёт родитель пропсами.
- Классы Tailwind компонента обязаны быть в CSS хоста (проверка покрытия
  `check-remote-classes.cjs`), свой Tailwind-бандл пакет не везёт.
  Хост регистрирует пакет директивой `@source` в `app/assets/css/tailwind.css` —
  без неё Tailwind v4 не сканирует `node_modules` и вычищает классы,
  используемые только внутри пакета.
- Версия `vue` — peer (`^3.5.0`), синхронно с host и remotes (правило №1).
