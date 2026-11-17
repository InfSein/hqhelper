import { compressString, decompressString, deepCopy } from '@/tools'
import { fixFuncConfig, type FuncConfigModel } from '@/types/config/func'
import { fixUserConfig, type UserConfigModel } from '@/types/config/user'

const baseFontFamily = '-apple-system, Helvetica Neue, Segoe UI, Microsoft Yahei, 微软雅黑, Arial, Helvetica, sans-serif'

/**
 * 组装全局字体栈
 * @param enFont 英文字体选项
 * @param customFont 用户自定义字体
 */
export const buildAppFontFamily = (
  enFont: UserConfigModel['custom_en_font'],
  customFont?: string
) => {
  let fontFamily = baseFontFamily
  const trimmedCustomFont = customFont?.trim()
  if (trimmedCustomFont) {
    fontFamily = `${trimmedCustomFont}, ${fontFamily}`
  }
  // 未选择自定义时，将预设英文字体置于自定义字体与系统回退字体之前
  if (enFont === 'lato') {
    fontFamily = `Lato, ${fontFamily}`
  } else if (enFont !== 'custom') {
    fontFamily = `'Google Sans', ${fontFamily}`
  }
  return `FFXIV, ${fontFamily}`
}

interface Preferences {
  u: UserConfigModel
  f: FuncConfigModel
}

export const exportPreferences = (userConfig: UserConfigModel, funcConfig: FuncConfigModel) => {
  // 删除缓存项目，减轻导出字符体积
  const u = deepCopy(userConfig) as any
  delete u.hqwb_cache_work_state
  delete u.mmhelper_cache_work_state
  delete u.gatherclock_cache_work_state
  const f = deepCopy(funcConfig)
  f.cache_item_prices = {}
  const o : Preferences = { u, f }
  return compressString(JSON.stringify(o))
}

export const importPreferences = (str: string) => {
  const o = JSON.parse(decompressString(str)) as Preferences
  return {
    u: fixUserConfig(o.u),
    f: fixFuncConfig(o.f)
  }
}