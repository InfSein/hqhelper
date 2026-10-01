import {
  HqData,
  XivUnpackedGatheringItems,
  XivUnpackedItems,
  type XivPatchVer,
} from '@/assets/data'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo } from '@/types/item'

export const getImgCdnUrl = (iconID: number, isHq = false) => {
  const CDN_ICON = 'https://icon.nbbjack.com/'
  const hq = isHq ? 'hq/' : ''
  const icon = iconID.toString().padStart(6, '0')
  return `${CDN_ICON}${icon.substring(0, 3)}000/${hq}${icon}.png`
}

/**
 * 获取版本装备数据
 */
export const getPatchData = (patch: XivPatchVer = '7.0') => {
  return HqData.patches[patch]
}

/**
 * 获取食药列表（按版本分组）
 */
export const getFtData = () => {
  const data = {} as Record<string, {
    count: number
    foods: ItemInfo[]
    tincs: ItemInfo[]
  }>

  const dealItem = (itemID: number, key: "foods" | "tincs") => {
    const itemInfo = getItemInfo(itemID)
    const p = itemInfo.patch
    if (!data[p]) {
      data[p] = {
        count: 0,
        foods: [],
        tincs: [],
      }
    }
    if (data[p][key].map(food => food.id).includes(itemID)) return // 去重
    data[p][key].push(itemInfo)
    data[p].count++
  }

  HqData.meals?.forEach(itemID => {
    dealItem(itemID, 'foods')
  })
  HqData.medicines?.forEach(itemID => {
    dealItem(itemID, 'tincs')
  })
  return data
}

/**
 * 获取限时采集物品（按版本/装等分组）
 */
export const getLimitedGatherings = () => {
  const map = {} as Record<string, ItemInfo[]>

  for (const itemID in XivUnpackedGatheringItems) {
    const id = Number(itemID)
    if (XivUnpackedGatheringItems[id].popTime) {
      if (!XivUnpackedItems[id]) continue
      const itemInfo = getItemInfo(id)
      if (!itemInfo?.gatherInfo?.timeLimitInfo) continue

      const itemPatch = itemInfo.patch
      let key = ''
      if (!itemPatch.startsWith('8.')) {
        let expansion = itemPatch.split('.')[0]
        if (expansion === '1') expansion = '2'
        key = `${expansion}.x`
      } else {
        const itemLevel = itemInfo.itemLevel <= 820 ? '~820' : itemInfo.itemLevel
        key = `${itemInfo.patch}-${itemLevel}`
      }

      if (!map[key]) map[key] = []
      map[key].push(itemInfo)
    }
  }
  return map
}
