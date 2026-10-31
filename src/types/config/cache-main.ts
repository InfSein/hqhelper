import { assignDefaults } from '@/tools'
import type { ServerMessage } from '@/types/api/nbb-cloud'

export interface MainCacheModel {
  ignore_announcements: number[]
  read_announcements: number[]
  server_messages: ServerMessage[]
}

const defaultMainCache: MainCacheModel = {
  ignore_announcements: [],
  read_announcements: [],
  server_messages: [],
}

/**
 * 修正用户配置，将其合并到默认配置中
 * 如果用户配置中有未定义的字段，则会使用默认配置中的值覆盖
 * 这样可以在添加配置项后保持对旧版本缓存的兼容性
 * @returns 修正后的用户配置
 */
export const fixMainCache = (cache?: MainCacheModel) => {
  // 处理特定环境下的设置项
  if (!cache) {
    cache = {} as MainCacheModel
  }

  // 处理其他的设置项
  const fixed = assignDefaults(defaultMainCache, cache || {}) as MainCacheModel
  if (!Array.isArray(fixed.server_messages)) {
    fixed.server_messages = []
  }
  return fixed
}