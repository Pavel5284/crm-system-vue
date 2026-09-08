export const convertCurrency = (amount: string | number, locale?: string | any) => {
  const loc = typeof locale === 'string' ? locale : (locale?.value ?? 'ru')
  const isRu = loc?.toString().startsWith('ru')
  const currency = isRu ? 'RUB' : 'USD'
  const localeStr = isRu ? 'ru-RU' : 'en-US'
  return new Intl.NumberFormat(localeStr, {
    style: 'currency',
    currency,
  }).format(Number(amount))
}

