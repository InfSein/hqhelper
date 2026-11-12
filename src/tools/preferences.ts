import { compressString, decompressString, deepCopy } from '@/tools'
import { fixFuncConfig, type FuncConfigModel } from '@/types/config/func'
import { fixUserConfig, type UserConfigModel } from '@/types/config/user'

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