# @crm/ui-kit

Общие презентационные компоненты и утилиты для host и всех remotes
(правило №5: дизайн-система — общий пакет, не федерируется).

## Состав

- `PhoneInput.vue` (`@crm/ui-kit/PhoneInput.vue`) — инпут телефона:
  санитизация ввода, keydown-фильтр, слоты `hint`/`error`.
- `phone` (`@crm/ui-kit/phone`) — утилиты: `sanitizePhoneDisplay`,
  `truncatePhoneDigits`, `normalizePhone`, `phoneToPayload`,
  `handlePhoneInput`, `handlePhoneKeydown`, `isPhoneDisplayValid`.

## Правила

- Без Nuxt/i18n-зависимостей: строки локализации (`placeholder`, `hint`,
  `error`) передаёт родитель пропсами.
- Классы Tailwind компонента обязаны быть в CSS хоста (проверка покрытия
  `check-remote-classes.cjs`), свой Tailwind-бандл пакет не везёт.
- Версия `vue` — peer (`^3.5.0`), синхронно с host и remotes (правило №1).
