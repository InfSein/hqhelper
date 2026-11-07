import { XivUnpackedItems } from '@/assets/data'

let cachedRecipeMap: Record<number, number> | null = null

/**
 * 获取物品 ID 到首个配方 ID 的映射表
 */
export function getRecipeMap(): Record<number, number> {
  if (!cachedRecipeMap) {
    const map: Record<number, number> = {}
    Object.values(XivUnpackedItems).forEach(item => {
      if (item.rids?.length) {
        map[item.id] = item.rids[0]
      }
    })
    cachedRecipeMap = map
  }
  return cachedRecipeMap
}
