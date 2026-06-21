import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatPrice(amount: number, currency = 'MAD') {
  return `${amount.toFixed(2)} ${currency}`
}

export function getLangName(item: Record<string, string | null>, lang: string, fallbackLangs = ['fr', 'en', 'ar']): string {
  const key = `name_${lang}`
  if (item[key]) return item[key] as string
  for (const fallback of fallbackLangs) {
    const fallbackKey = `name_${fallback}`
    if (item[fallbackKey]) return item[fallbackKey] as string
  }
  return ''
}

export function getLangDesc(item: Record<string, string | null>, lang: string, fallbackLangs = ['fr', 'en', 'ar']): string {
  const key = `description_${lang}`
  if (item[key]) return item[key] as string
  for (const fallback of fallbackLangs) {
    const fallbackKey = `description_${fallback}`
    if (item[fallbackKey]) return item[fallbackKey] as string
  }
  return ''
}
