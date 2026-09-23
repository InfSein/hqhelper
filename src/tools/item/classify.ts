import type { ItemInfo } from '@/types/item'

/** 基础素材按获取方式的分类结果 */
interface ClassifiedMaterials {
  /** 常规采集 */
  gatherableCommon: ItemInfo[]
  /** 限时采集 */
  gatherableLimited: ItemInfo[]
  /** 灵砂 */
  aethersands: ItemInfo[]
  /** 点数/工票兑换道具 */
  tomeScriptItems: ItemInfo[]
  /** 碎晶/水晶/晶簇 */
  crystals: ItemInfo[]
  /** 其他道具（怪物掉落/杂项） */
  other: ItemInfo[]
}

/**
 * 将素材列表按游戏内统一的获取方式进行分类
 * 确保各 Panel 在判定采集、限时、灵砂、兑换、水晶时业务口径完全一致
 */
export function classifyMaterials(items: ItemInfo[]): ClassifiedMaterials {
  const result: ClassifiedMaterials = {
    gatherableCommon: [],
    gatherableLimited: [],
    aethersands: [],
    tomeScriptItems: [],
    crystals: [],
    other: [],
  }

  items.forEach(item => {
    if (item.isCrystal) {
      result.crystals.push(item)
    } else if (item.gatherInfo?.jobId || item.gatherInfo?.placeID) {
      if (item.gatherInfo.timeLimitInfo?.length) {
        result.gatherableLimited.push(item)
      } else {
        result.gatherableCommon.push(item)
      }
    } else if (item.isAethersand || item.canReduceFrom?.length) {
      result.aethersands.push(item)
    } else if (item.tradeInfo?.costId) {
      result.tomeScriptItems.push(item)
    } else {
      result.other.push(item)
    }
  })

  // 兑换道具按货币 ID 与游戏内商店顺序重排
  result.tomeScriptItems.sort((a, b) =>
    (a.tradeInfo!.costId - b.tradeInfo!.costId) ||
    (a.uiTypeOrder - b.uiTypeOrder) ||
    (a.sortOrder - b.sortOrder) ||
    (a.id - b.id),
  )

  return result
}

/**
 * 将可制作物品按职业 ID 分组（合并同 ID 数量）
 */
export function groupCraftablesByJob(items: ItemInfo[]): Record<number, ItemInfo[]> {
  const groups: Record<number, ItemInfo[]> = {}
  items.forEach(item => {
    if (!item.craftInfo?.jobId) return
    const jobId = item.craftInfo.jobId
    groups[jobId] ??= []
    const existing = groups[jobId].find(i => i.id === item.id)
    if (existing) {
      existing.amount += item.amount
    } else {
      groups[jobId].push({ ...item })
    }
  })
  return groups
}
