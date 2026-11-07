import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type AvailableLocale = "zh" | "en" | "ja"

const DEFAULT_INTERPOLATION_KEYS = [
  // 为了兼容旧数据默认插值
  'content', 'contents', 'control_val', 'count', 'craftsmanship_val',
  'dataname', 'date', 'days', 'err', 'errmsg', 'error', 'f', 'gen',
  'hours', 'id', 'il', 'ilv', 'index', 'job', 'key', 'lang', 'limit',
  'maxlen', 'minute', 'minutes', 'name', 'num', 'option', 'patch', 'platform', 'pos',
  'second', 'setting', 'stage', 'tool', 'v', 'val', 'ver',
]

export function useLocale() {
  const { locale, t: rawT } = useI18n()

  // 当前语言
  const currentLocale = computed(() => locale.value as AvailableLocale)

  // 切换语言
  const setLocale = (lang: AvailableLocale) => {
    if (currentLocale.value !== lang) {
      locale.value = lang
      localStorage.setItem('locale', lang)
    }
  }

  // 增强版 t 函数
  const t = (message: string, args?: any): string => {
    const rawTranslate = rawT(message)

    if (typeof rawTranslate !== 'string') {
      console.warn(`[i18n] '${message}' resolved to a non-string`)
      return message
    }

    let result = ''

    if (typeof args === 'object') {
      result = rawT(message, args)
    } else if (args !== undefined) {
      result = rawT(message, Object.fromEntries(DEFAULT_INTERPOLATION_KEYS.map(k => [k, args])))
    } else {
      result = rawT(message)
    }

    if (result === 'DONT_SHOW') result = ''

    return result
  }

  return {
    /** 增强版 t 函数 */
    t,
    /** 原始 t 函数 */
    rawT,
    /** 当前语言 */
    currentLocale,
    /** 切换语言 */
    setLocale,
  }
}

export default useLocale
