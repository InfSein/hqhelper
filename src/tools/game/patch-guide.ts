import {
  XivPatches,
  XivUnpackedGatheringItems,
  XivUnpackedItems,
  XivUnpackedRecipes,
  XivUnpackedTradeMap,
  XivRoles,
  XivJobRoleMap,
  HqData,
  type XivPatchVer,
  type HqDataVer,
} from '@/assets/data'
import { getItemInfo, sortItems, type ItemInfo } from '@/tools/item'
import { useNbbCal } from '@/tools/use-nbb-cal'
import { fixGearSelections, type AttireAffix, type AccessoryAffix, type GearSelections } from '@/types/game/gear'

/**
 * 判断物品所属版本是否与指定版本相匹配
 * 考虑到主版本与其子版本关系（例如 7.0 包含 7.05）
 */
export const isItemInPatch = (itemPatch: string, patchVer: string): boolean => {
  if (!itemPatch) return false
  if (itemPatch === patchVer) return true
  const patchConfig = XivPatches.find(p => p.v === patchVer)
  if (patchConfig?.v_sub && itemPatch === patchConfig.v_sub) return true
  return false
}

/**
 * 获取指定版本新增的传说/限时采集物品
 */
export const getPatchLegendaryGatherings = (patchVer: string): ItemInfo[] => {
  const items: ItemInfo[] = []
  for (const idStr in XivUnpackedGatheringItems) {
    const id = Number(idStr)
    const rawItem = XivUnpackedItems[id]
    const gatherData = XivUnpackedGatheringItems[id]
    if (!rawItem || !gatherData?.popTime) continue
    if (isItemInPatch(rawItem.p, patchVer)) {
      const itemInfo = getItemInfo(id)
      if (itemInfo.valid && itemInfo.gatherInfo?.timeLimitInfo?.length) {
        items.push(itemInfo)
      }
    }
  }
  // 按职业和ID排序
  return items.sort((a, b) => (a.gatherInfo.jobId - b.gatherInfo.jobId) || (a.id - b.id))
}

export interface PatchTradeGroup {
  costItem: ItemInfo
  items: {
    targetItem: ItemInfo
    costCount: number
  }[]
}

/**
 * 获取指定版本新增的可兑换物品，按兑换消耗货币分组
 */
export const getPatchTradeItems = (patchVer: string): PatchTradeGroup[] => {
  const groupMap = new Map<number, { targetItem: ItemInfo, costCount: number }[]>()

  for (const idStr in XivUnpackedTradeMap) {
    const id = Number(idStr)
    const rawItem = XivUnpackedItems[id]
    if (!rawItem || !isItemInPatch(rawItem.p, patchVer)) continue
    const tradeInfo = XivUnpackedTradeMap[id]
    if (!tradeInfo || !tradeInfo.costId) continue

    const targetItem = getItemInfo(id)
    if (!targetItem.valid) continue

    const costId = tradeInfo.costId
    if (!groupMap.has(costId)) {
      groupMap.set(costId, [])
    }
    groupMap.get(costId)!.push({
      targetItem,
      costCount: tradeInfo.costCount,
    })
  }

  const groups: PatchTradeGroup[] = []
  for (const [costId, tradeList] of groupMap.entries()) {
    tradeList.sort((a, b) =>
      (a.targetItem.uiTypeOrder - b.targetItem.uiTypeOrder) ||
      (a.targetItem.sortOrder - b.targetItem.sortOrder) ||
      (a.targetItem.id - b.targetItem.id),
    )
    groups.push({
      costItem: getItemInfo(costId),
      items: tradeList,
    })
  }

  // 按照兑换代币排序
  return groups.sort((a, b) =>
    (a.costItem.uiTypeOrder - b.costItem.uiTypeOrder) ||
    (a.costItem.sortOrder - b.costItem.sortOrder) ||
    (a.costItem.id - b.costItem.id),
  )
}

// 缓存所有配方中使用过的材料ID
const materialsUsedInRecipes = new Set<number>()
for (const rid in XivUnpackedRecipes) {
  const recipe = XivUnpackedRecipes[rid]
  if (recipe.materials) {
    for (let i = 0; i < recipe.materials.length; i += 2) {
      materialsUsedInRecipes.add(recipe.materials[i])
    }
  }
}

/**
 * 获取指定版本新增的秘籍半成品（需要习得秘籍且被其他配方引用为材料）
 */
export const getPatchMasterRecipeItems = (patchVer: string): ItemInfo[] => {
  const items: ItemInfo[] = []
  for (const idStr in XivUnpackedItems) {
    const id = Number(idStr)
    const rawItem = XivUnpackedItems[id]
    if (!rawItem || !isItemInPatch(rawItem.p, patchVer)) continue
    if (!rawItem.rids?.length) continue

    const recipe = XivUnpackedRecipes[rawItem.rids[0]]
    if (recipe && recipe.srb > 0 && materialsUsedInRecipes.has(id)) {
      const itemInfo = getItemInfo(id)
      if (itemInfo.valid) {
        items.push(itemInfo)
      }
    }
  }
  return sortItems(items, 'recipeOrder')
}

/**
 * 获取指定版本新增的食物
 */
export const getPatchFoods = (patchVer: string): ItemInfo[] => {
  const items: ItemInfo[] = []
  HqData.meals.forEach(id => {
    const rawItem = XivUnpackedItems[id]
    if (rawItem && isItemInPatch(rawItem.p, patchVer)) {
      const itemInfo = getItemInfo(id)
      if (itemInfo.valid) {
        items.push(itemInfo)
      }
    }
  })
  return items.sort((a, b) => (b.itemLevel - a.itemLevel) || (a.id - b.id))
}

/**
 * 获取指定版本新增的爆发药
 */
export const getPatchMedicines = (patchVer: string): ItemInfo[] => {
  const items: ItemInfo[] = []
  HqData.medicines?.forEach(id => {
    const rawItem = XivUnpackedItems[id]
    if (rawItem && isItemInPatch(rawItem.p, patchVer)) {
      const itemInfo = getItemInfo(id)
      if (itemInfo.valid) {
        items.push(itemInfo)
      }
    }
  })
  return items.sort((a, b) => (b.itemLevel - a.itemLevel) || (a.id - b.id))
}

export interface CategorizedMaterials {
  normalPrecrafts: ItemInfo[]
  aethersands: ItemInfo[]
  masterPrecrafts: ItemInfo[]
}

/**
 * 辅助方法：从 nbb-cal 结果中归类素材
 */
const extractMaterials = (statistics: any, patchData: HqDataVer | null): CategorizedMaterials => {
  const normalPrecrafts: ItemInfo[] = []
  const masterPrecrafts: ItemInfo[] = []
  const aethersands: ItemInfo[] = []

  if (!statistics) {
    return { normalPrecrafts, aethersands, masterPrecrafts }
  }

  // 从 lv1 中提取半成品（普通半成品与秘籍半成品）
  for (const id in statistics.lv1) {
    const itemCalculated = statistics.lv1[id]
    const item = getItemInfo(itemCalculated)
    if (item.isCrystal) continue
    if (item.craftInfo?.recipeId) {
      if (item.craftInfo.masterRecipeId) {
        masterPrecrafts.push(item)
      } else {
        normalPrecrafts.push(item)
      }
    }
  }

  // 从 lvBase 中提取灵砂（通过 isAethersand 或 patchData.reduces 判断）
  const reducesAethersandIds = Object.keys(patchData?.reduces ?? {}).map(Number)
  for (const id in statistics.lvBase) {
    const itemCalculated = statistics.lvBase[id]
    const item = getItemInfo(itemCalculated)
    const numId = Number(id)
    if (item.isAethersand || reducesAethersandIds.includes(numId)) {
      aethersands.push(item)
    }
  }

  // 统一排序
  sortItems(normalPrecrafts, 'recipeOrder')
  sortItems(masterPrecrafts, 'recipeOrder')
  aethersands.sort((a, b) => a.id - b.id)

  return {
    normalPrecrafts,
    aethersands,
    masterPrecrafts,
  }
}

/**
 * 计算指定版本某一个战斗职业一整套装备所需素材
 */
export const calcJobGearMaterials = (
  patchVer: string,
  jobId: number,
): CategorizedMaterials | null => {
  const patchData = HqData.patches[patchVer as XivPatchVer]
  if (!patchData || !patchData.mainHand?.[jobId]) {
    return null
  }

  const role = XivJobRoleMap[jobId]
  if (!role) return null

  const gears: GearSelections = fixGearSelections()

  // 主手与副手
  gears.mainHand[jobId] = 1
  if (patchData.offHand?.[jobId]) {
    gears.offHand[jobId] = 1
  }

  // 五件防具
  const attire = role.attire as AttireAffix
  gears.headAttire[attire] = 1
  gears.bodyAttire[attire] = 1
  gears.handsAttire[attire] = 1
  gears.legsAttire[attire] = 1
  gears.feetAttire[attire] = 1

  // 饰品（耳、项、腕各1，戒2）
  const accessory = role.accessory as AccessoryAffix
  gears.earrings[accessory] = 1
  gears.necklace[accessory] = 1
  gears.wrist[accessory] = 1
  gears.rings[accessory] = 2

  const { calGearSelections } = useNbbCal()
  const statistics = calGearSelections(gears, patchVer as XivPatchVer)

  return extractMaterials(statistics, patchData)
}

/**
 * 计算指定版本生产采集职业全套装备所需素材
 */
export const calcLifeJobsGearMaterials = (
  patchVer: string,
): CategorizedMaterials | null => {
  const patchData = HqData.patches[patchVer as XivPatchVer]
  // 必须存在生产采集装备（如刻木匠主手）
  if (!patchData || !patchData.mainHand?.[8]) {
    return null
  }

  const gears: GearSelections = fixGearSelections()

  // 1. 生产职业全部主副手
  XivRoles.crafter.jobs.forEach(j => {
    if (patchData.mainHand?.[j]) gears.mainHand[j] = 1
    if (patchData.offHand?.[j]) gears.offHand[j] = 1
  })

  // 2. 采集职业全部主副手
  XivRoles.gatherer.jobs.forEach(j => {
    if (patchData.mainHand?.[j]) gears.mainHand[j] = 1
    if (patchData.offHand?.[j]) gears.offHand[j] = 1
  })

  // 3. 生产防具与饰品
  const crafterAttire = XivRoles.crafter.attire as AttireAffix
  gears.headAttire[crafterAttire] = 1
  gears.bodyAttire[crafterAttire] = 1
  gears.handsAttire[crafterAttire] = 1
  gears.legsAttire[crafterAttire] = 1
  gears.feetAttire[crafterAttire] = 1

  const crafterAcc = XivRoles.crafter.accessory as AccessoryAffix
  gears.earrings[crafterAcc] = 1
  gears.necklace[crafterAcc] = 1
  gears.wrist[crafterAcc] = 1
  gears.rings[crafterAcc] = 2

  // 4. 采集防具与饰品
  const gathererAttire = XivRoles.gatherer.attire as AttireAffix
  gears.headAttire[gathererAttire] = 1
  gears.bodyAttire[gathererAttire] = 1
  gears.handsAttire[gathererAttire] = 1
  gears.legsAttire[gathererAttire] = 1
  gears.feetAttire[gathererAttire] = 1

  const gathererAcc = XivRoles.gatherer.accessory as AccessoryAffix
  gears.earrings[gathererAcc] = 1
  gears.necklace[gathererAcc] = 1
  gears.wrist[gathererAcc] = 1
  gears.rings[gathererAcc] = 2

  const { calGearSelections } = useNbbCal()
  const statistics = calGearSelections(gears, patchVer as XivPatchVer)

  return extractMaterials(statistics, patchData)
}
