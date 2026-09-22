import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import {
  HqData,
  XivJobs,
  XivUnpackedGatheringItems,
  XivUnpackedItems,
  XivUnpackedRecipes,
  type XivPatchVer,
} from '@/assets/data'
import type { GearSelections } from '@/types/game/gear'
import type { RecommItemGroup } from '@/types/item'
import type {
  CalInputEntry,
  CalResult,
  CalResultItem,
  ProStatementBlock,
  StatementData,
} from '@/types/core'
import { getItemInfo, sortItems, type ItemInfo } from '@/tools/item'
import { deepCopy } from '@/tools'

// #region 模块级缓存与数据映射

let cachedRecipeMap: Record<number, number> | null = null

/**
 * 获取物品 ID 到首个配方 ID 的映射表
 */
function getRecipeMap(): Record<number, number> {
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

// #endregion

// #region 纯函数核心计算引擎

/**
 * 处理顶层制作目标队列
 */
function expandTopLevel(
  calMap: Record<string, CalInputEntry>,
  shipArr: number[] = [],
): Record<string, CalResultItem> {
  const result: Record<string, CalResultItem> = {}

  for (const id in calMap) {
    const numId = Number(id)
    if (shipArr.includes(numId)) continue
    // 特殊场景跳过标记
    if (calMap[id].length === 5 && calMap[id][4]) continue

    const need = calMap[id][1]
    const recipeId = calMap[id][2]
    const checked = calMap[id][3]
    const recipe = XivUnpackedRecipes[recipeId]
    const item = XivUnpackedItems[numId]

    if (!item) continue

    if (recipe) {
      const pc = recipe.yields
      let mkc = Math.floor(need / pc)
      mkc += (need % pc) > 0 ? 1 : 0

      result[id] = {
        id: numId,
        rid: recipeId,
        checked,
        job: recipe.job,
        name: item.name,
        icon: item.icon,
        desc: item.desc,
        uc: item.uc,
        need,
        mkc,
        pc,
      }
    } else {
      result[id] = {
        id: numId,
        checked,
        rid: [],
        name: item.name,
        icon: item.icon,
        desc: item.desc,
        uc: item.uc,
        need,
        mkc: 0,
      }
    }
  }

  return result
}

/**
 * 逐级展开材料（支持水晶与常规素材）
 */
function expandMaterials(
  itemTemMap: Record<string, CalResultItem>,
  hideCluster = false,
  shipArr: number[] = [],
): Record<string, CalResultItem> {
  const reMap: Record<string, CalResultItem> = {}

  for (const id in itemTemMap) {
    if (itemTemMap[id].checked === true) continue

    let rid = itemTemMap[id].rid
    if (rid === undefined || (Array.isArray(rid) && rid.length === 0)) {
      continue
    }
    if (Array.isArray(rid)) {
      rid = rid[0]
    }

    const recipe = XivUnpackedRecipes[rid]
    if (!recipe) continue

    const material = recipe.materials
    const shard = recipe.crystals
    const mkc = itemTemMap[id].mkc

    // 展开水晶类
    for (let i = 0; i < shard.length; i += 2) {
      if (hideCluster) continue
      const shardId = shard[i]
      if (shardId <= 0) continue

      const item = XivUnpackedItems[shardId]
      if (!item) continue

      const count = mkc * shard[i + 1]
      const shardKey = String(shardId)

      if (reMap[shardKey]) {
        reMap[shardKey].need += count
      } else {
        reMap[shardKey] = {
          id: shardId,
          rid: [],
          icon: item.icon,
          name: item.name,
          desc: item.desc,
          uc: item.uc,
          need: count,
          mkc: 0,
          pc: 1,
        }
      }
    }

    // 展开常规材料
    for (let j = 0; j < material.length; j += 2) {
      const itemId = material[j]
      if (shipArr.includes(Number(itemId))) continue

      const item = XivUnpackedItems[itemId]
      if (!item) continue

      const count = mkc * material[j + 1]
      const itemKey = String(itemId)

      if (reMap[itemKey]) {
        reMap[itemKey].need += count
      } else {
        reMap[itemKey] = {
          id: itemId,
          rid: item.rids,
          name: item.name,
          icon: item.icon,
          desc: item.desc,
          uc: item.uc,
          need: count,
          mkc: 0,
          pc: 1,
        }
      }
    }
  }

  // 针对展开出的有配方的材料，计算其生产次数与产出
  for (const k in reMap) {
    const item = reMap[k]
    let mkc1 = 0
    const need1 = item.need
    let pc1 = 0

    const rid = item.rid
    const firstRid = Array.isArray(rid) ? rid[0] : rid
    if (firstRid) {
      const targetRecipe = XivUnpackedRecipes[firstRid]
      if (targetRecipe) {
        pc1 = targetRecipe.yields
        mkc1 = Math.floor(need1 / pc1)
        mkc1 += (need1 % pc1) > 0 ? 1 : 0
      }
    }

    reMap[k].mkc = mkc1
    reMap[k].pc = pc1
  }

  return reMap
}

/**
 * 汇总基础素材（无法再进一步分解的素材）
 */
function accumulateBaseMaterials(
  temmap: Record<string, CalResultItem>,
  sumMap02: Record<string, CalResultItem>,
): Record<string, CalResultItem> {
  for (const id in temmap) {
    if (temmap[id].checked === true) continue

    const num = temmap[id].need
    const rid = temmap[id].rid

    if (rid === undefined || (Array.isArray(rid) && rid.length === 0)) {
      if (sumMap02[id]) {
        sumMap02[id].need += num
      } else {
        sumMap02[id] = {
          id: Number(id),
          name: temmap[id].name,
          icon: temmap[id].icon,
          desc: temmap[id].desc,
          uc: temmap[id].uc,
          need: num,
          mkc: 0,
        }
      }
    }
  }
  return sumMap02
}

/**
 * 递归配方展开计算主函数
 */
function doCal(
  calMap: Record<string, CalInputEntry>,
  hideCluster = false,
  shipArr0: number[] = [],
  shipArr1: number[] = [],
  shipArr2: number[] = [],
  shipArr3: number[] = [],
  shipArr4: number[] = [],
): CalResult {
  const sumMap0 = expandTopLevel(calMap, shipArr0)
  const sumMap1 = expandMaterials(sumMap0, hideCluster, shipArr1)
  const sumMap2 = expandMaterials(sumMap1, hideCluster, shipArr2)
  const sumMap3 = expandMaterials(sumMap2, hideCluster, shipArr3)
  const sumMap4 = expandMaterials(sumMap3, hideCluster, shipArr4)
  const sumMap5 = expandMaterials(sumMap4, hideCluster)

  let sumMap02: Record<string, CalResultItem> = {}
  sumMap02 = accumulateBaseMaterials(sumMap1, sumMap02)
  sumMap02 = accumulateBaseMaterials(sumMap2, sumMap02)
  sumMap02 = accumulateBaseMaterials(sumMap3, sumMap02)
  sumMap02 = accumulateBaseMaterials(sumMap4, sumMap02)
  sumMap02 = accumulateBaseMaterials(sumMap5, sumMap02)

  const re: CalResult = {
    ls: sumMap0,
    lv1: sumMap1,
    lv2: sumMap2,
    lv3: sumMap3,
    lv4: sumMap4,
    lv5: sumMap5,
    lvBase: sumMap02,
  }
  return JSON.parse(JSON.stringify(re))
}

// #endregion

/**
 * 核心算法与配方计算 Composable
 */
export function useAppCore() {
  const store = useStore()
  const { t } = useLocale()

  const recipeMap = getRecipeMap()

  /**
   * 直接通过 itemMap 计算所需道具
   * @param selections key: 道具 id, value: 数量
   */
  const calItems = (selections: Record<number, number>): CalResult => {
    const calMap: Record<string, CalInputEntry> = {}
    for (const item in selections) {
      const count = selections[item]
      if (!count) continue
      const itemId = Number(item)
      calMap[item] = [itemId, count, recipeMap[itemId], false]
    }
    return doCal(calMap)
  }

  /**
   * 计算指定装备选择所需的素材统计
   */
  const calGearSelections = (input: GearSelections, patch: XivPatchVer = '7.0'): CalResult | undefined => {
    const patchData = HqData.patches[patch] as any
    if (!patchData) {
      return undefined
    }
    const data = JSON.parse(JSON.stringify(input))
    const out: Record<string, CalInputEntry> = {}

    for (const gearKey in data) {
      const gear = data[gearKey]
      for (const jobId in gear) {
        if (gear[jobId] > 0) {
          const item = patchData?.[gearKey]?.[jobId]
          if (item) {
            out[item] = [item, gear[jobId], recipeMap[item], false]
          } else if (item !== 0) {
            console.warn('wrong index?', gearKey, jobId)
          }
        }
      }
    }
    return doCal(out)
  }

  /**
   * 获取版本装备数据
   */
  const getPatchData = (patch: XivPatchVer = '7.0') => {
    return HqData.patches[patch]
  }

  /**
   * 获取特殊道具（灵砂与炼金药）
   */
  const getSpecialItems = (patch: XivPatchVer = '7.0') => {
    const data = HqData.patches[patch]

    return {
      aethersands: Object.keys(data?.reduces ?? []).map(Number),
      alkahests: data?.alkahests,
    }
  }

  /**
   * 获取食药列表（按版本分组）
   */
  const getFoodAndTincs_v2 = () => {
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

    HqData.meals.forEach(itemID => {
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
  const getLimitedGatherings = () => {
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

  /**
   * 获取查看报表需要的数据
   * @param statistics 通过配方展开计算获得的统计数据
   */
  const getStatementData = (statistics: any): StatementData => {
    const craftTargets: ItemInfo[] = []
    const materialsLv1: ItemInfo[] = []
    const materialsLv2: ItemInfo[] = []
    const materialsLv3: ItemInfo[] = []
    const materialsLv4: ItemInfo[] = []
    const materialsLv5: ItemInfo[] = []
    const materialsLvBase: ItemInfo[] = []

    processStatistics(statistics.ls, craftTargets)
    processStatistics(statistics.lv1, materialsLv1)
    processStatistics(statistics.lv2, materialsLv2)
    processStatistics(statistics.lv3, materialsLv3)
    processStatistics(statistics.lv4, materialsLv4)
    processStatistics(statistics.lv5, materialsLv5)
    processStatistics(statistics.lvBase, materialsLvBase)

    return {
      craftTargets,
      materialsLv1,
      materialsLv2,
      materialsLv3,
      materialsLv4,
      materialsLv5,
      materialsLvBase,
    }

    function processStatistics(_in: any, out: ItemInfo[]) {
      const ignoreCrystal = store.funcConfig.statement_ignore_crystals
      for (const id in _in) {
        const item = getItemInfo(_in[id])
        if (ignoreCrystal && item.isCrystal) continue
        out.push(item)
      }
    }
  }

  /**
   * 获取进阶报表所需数据
   */
  const getProStatementData = (
    craftTargets: ItemInfo[],
    itemsPrepared: {
      craftTarget: Record<number, number>
      materialsLv1: Record<number, number>
      materialsLvBase: Record<number, number>
    },
  ) => {
    const isCrystal = (itemid: number) => itemid >= 2 && itemid <= 19

    const targetItems: Record<number, number> = {}
    Object.values(craftTargets).forEach(item => {
      targetItems[item.id] = item.amount
    })

    const targetItemsForCal: Record<number, number> = {}
    Object.values(craftTargets).forEach(item => {
      targetItemsForCal[item.id] = item.amount
    })
    Object.keys(itemsPrepared.craftTarget).forEach(itemID => {
      const id = Number(itemID)
      targetItemsForCal[id] -= itemsPrepared.craftTarget[id]
    })

    const lv1Items: Record<number, number> = {}
    const statisticsForLv1 = calItems(targetItemsForCal)
    Object.values(statisticsForLv1.lv1).forEach((calResult: any) => {
      const itemID: number = calResult.id
      const amount: number = calResult.need
      if (store.funcConfig.statement_ignore_crystals && isCrystal(itemID)) return
      lv1Items[itemID] = amount
    })

    const lv1ItemsForCal = deepCopy(lv1Items)
    Object.keys(itemsPrepared.materialsLv1).forEach(itemID => {
      const id = Number(itemID)
      if (!lv1ItemsForCal[id]) return
      lv1ItemsForCal[id] -= itemsPrepared.materialsLv1[id]
    })

    const baseItems: Record<number, number> = {}
    const statistics = calItems(lv1ItemsForCal)
    Object.values(statistics.lvBase).forEach((calResult: any) => {
      const itemID: number = calResult.id
      const amount: number = calResult.need
      if (store.funcConfig.statement_ignore_crystals && isCrystal(itemID)) return
      baseItems[itemID] = amount
    })

    // 针对制作目标(直接素材列表)中没有配方的道具进行特殊处理
    Object.keys(lv1ItemsForCal).forEach(itemID => {
      const id = Number(itemID)
      if (!recipeMap[id]) {
        baseItems[id] ??= 0
        baseItems[id] += lv1ItemsForCal[id]
      }
    })

    const baseItemsForCal = deepCopy(baseItems)
    Object.keys(itemsPrepared.materialsLvBase).forEach(itemID => {
      const id = Number(itemID)
      if (!baseItemsForCal[id]) return
      baseItemsForCal[id] -= itemsPrepared.materialsLvBase[id]
    })

    const statementBlocks: ProStatementBlock[] = [
      {
        id: 'craft-target',
        name: t('statement.list.targets'),
        items: targetItems,
        preparedKey: 'craftTarget',
      },
      {
        id: 'material-lv1',
        name: t('statement.list.material.lv1'),
        items: lv1Items,
        preparedKey: 'materialsLv1',
      },
      {
        id: 'material-lvBase',
        name: t('statement.list.material.lvbase'),
        items: baseItems,
        preparedKey: 'materialsLvBase',
      },
    ]

    return {
      targetItems,
      targetItemsForCal,
      lv1Items,
      lv1ItemsForCal,
      baseItems,
      baseItemsForCal,
      statementBlocks,
    }
  }

  /**
   * 根据已扣除准备物品的数量计算推荐流程所需数据
   */
  const calRecommProcessData = (
    targetItemsForCal: Record<number, number>,
    lv1ItemsForCal: Record<number, number>,
    baseItemsForCal: Record<number, number>,
  ) => {
    const craftTargets = dealItemMapToItemList(targetItemsForCal)
    const lv1Items = dealItemMapToItemList(lv1ItemsForCal)

    const lv2Map: Record<number, number> = {}
    const lv3Map: Record<number, number> = {}
    const statistics = calItems(lv1ItemsForCal)

    Object.values(statistics.lv1).forEach((calResult: any) => {
      const itemID: number = calResult.id
      const amount: number = calResult.need
      lv2Map[itemID] = amount
    })
    Object.values(statistics.lv2).forEach((calResult: any) => {
      const itemID: number = calResult.id
      const amount: number = calResult.need
      lv3Map[itemID] = amount
    })
    const lv2Items = dealItemMapToItemList(lv2Map)
    const lv3Items = dealItemMapToItemList(lv3Map)

    const lvBaseItems = dealItemMapToItemList(baseItemsForCal)

    return {
      craftTargets,
      lv1Items,
      lv2Items,
      lv3Items,
      lvBaseItems,
    }

    function dealItemMapToItemList(itemMap: Record<number, number>) {
      const list: ItemInfo[] = []
      for (const _id in itemMap) {
        const id = Number(_id)
        const amount = itemMap[id]
        if (amount > 0) {
          const itemInfo = getItemInfo(id)
          itemInfo.amount = amount
          list.push(itemInfo)
        }
      }
      return list
    }
  }

  /**
   * 计算推荐流程分组
   */
  const calRecommProcessGroups = (
    craftTargets: ItemInfo[],
    lv1Items: ItemInfo[],
    lv2Items: ItemInfo[],
    lv3Items: ItemInfo[],
    lvBaseItems: ItemInfo[],
    processes_craftable_item_sortby: string,
    processes_merge_gatherings: boolean,
    language_ui: "zh" | "en" | "ja",
    tFn: (message: string, args?: any) => string,
  ) => {
    const itemsGatherableCommon: ItemInfo[] = []
    const itemsGatherableLimited: ItemInfo[] = []
    const aethersands: ItemInfo[] = []
    let itemsTradable: ItemInfo[] = []
    const itemsOtherCollectable: ItemInfo[] = []
    const itemsPrePrePrecraft: Record<number, ItemInfo[]> = {}
    const itemsPrePrecraft: Record<number, ItemInfo[]> = {}
    const itemsPrecraft: Record<number, ItemInfo[]> = {}
    const itemsTarget: Record<number, ItemInfo[]> = {}

    // 从基础素材中检索分类
    lvBaseItems.forEach(item => {
      if (item.gatherInfo?.jobId) {
        if (item.gatherInfo.timeLimitInfo?.length) {
          itemsGatherableLimited.push(item)
        } else {
          itemsGatherableCommon.push(item)
        }
      } else if (item.canReduceFrom?.length) {
        aethersands.push(item)
      } else if (item.tradeInfo?.costId) {
        itemsTradable.push(item)
      } else {
        if (!item.isCrystal) {
          itemsOtherCollectable.push(item)
        }
      }
    })

    // 对部分组的物品进行排序
    itemsTradable = itemsTradable.sort((a, b) =>
      (a.tradeInfo!.costId - b.tradeInfo!.costId) ||
      (a.uiTypeOrder - b.uiTypeOrder) ||
      (a.sortOrder - b.sortOrder) ||
      (a.id - b.id),
    )

    // 逐级遍历半成品
    lv1Items.forEach(item => {
      if (item.craftInfo?.jobId) {
        dealCraftableItem(itemsPrecraft, item)
      }
    })
    lv2Items.forEach(item => {
      if (item.craftInfo?.jobId) {
        dealCraftableItem(itemsPrePrecraft, item)
      }
    })
    lv3Items.forEach(item => {
      if (item.craftInfo?.jobId) {
        dealCraftableItem(itemsPrePrePrecraft, item)
      }
    })

    // 最终处理成品
    craftTargets.forEach(item => {
      if (item.craftInfo?.jobId) {
        dealCraftableItem(itemsTarget, item)
      }
    })

    function dealCraftableItem(target: Record<number, ItemInfo[]>, item: ItemInfo) {
      const jobId = item.craftInfo!.jobId
      target[jobId] ??= []
      const existing = target[jobId].find(_item => item.id === _item.id)
      if (existing) {
        existing.amount += item.amount
      } else {
        target[jobId].push(item)
      }
    }

    const groups: RecommItemGroup[] = []
    const dealGatherings = (
      gathering: ItemInfo[],
      type: "common" | "limited",
      groupTitle: string,
      orderBy?: "map" | "start-time",
      mergeJobs?: {
        iconUrl: string
      },
    ) => {
      if (!gathering?.length) return
      if (orderBy === 'map') {
        gathering.sort((a, b) => {
          const aMap = a.gatherInfo.placeID
          const bMap = b.gatherInfo.placeID
          if (aMap === bMap) {
            return a.gatherInfo.posVal - b.gatherInfo.posVal
          }
          return aMap - bMap
        })
      } else if (orderBy === 'start-time') {
        gathering.sort((a, b) => {
          let startA = 99, startB = 99
          a.gatherInfo.timeLimitInfo.forEach(limit => {
            startA = Math.min(startA, Number(limit.start.split(':')[0]))
          })
          b.gatherInfo.timeLimitInfo.forEach(limit => {
            startB = Math.min(startB, Number(limit.start.split(':')[0]))
          })
          return startA - startB
        })
      }
      if (mergeJobs) {
        groups.push({
          type: `gather-${type}`,
          title: groupTitle,
          icon: mergeJobs.iconUrl,
          items: gathering,
        })
      } else {
        const itemsGatheredBy = {
          16: [], 17: [], 18: [],
        } as Record<number, ItemInfo[]>
        gathering.forEach(item => {
          itemsGatheredBy[item.gatherInfo.jobId].push(item)
        });
        ([16, 17, 18]).forEach(jobid => {
          if (itemsGatheredBy[jobid].length) {
            groups.push({
              type: `gather-${type}`,
              title: groupTitle.replace('{job}', XivJobs[jobid][`job_name_${language_ui}`]),
              icon: XivJobs[jobid].job_icon_url,
              items: itemsGatheredBy[jobid],
            })
          }
        })
      }
    }

    const dealCraftings = (
      craftings: Record<number, ItemInfo[]>,
      type: "target" | "precraft" | "preprecraft" | "prepreprecraft",
      groupTitle: string,
    ) => {
      Object.keys(craftings).forEach(_jobID => {
        const jobId = Number(_jobID)
        const job = XivJobs[jobId]
        const items = craftings[jobId]
        if (processes_craftable_item_sortby === 'recipeOrder') {
          sortItems(items, 'recipeOrder')
        }
        groups.push({
          type: `craft-${type}`,
          title: groupTitle.replace('{job}', job[`job_name_${language_ui}`]),
          icon: job.job_icon_url,
          items,
        })
      })
    }

    const insituTp = { job: '{job}' }

    if (processes_merge_gatherings) {
      dealGatherings(itemsGatherableCommon, 'common', tFn('recomm_process.group.common_gathering', insituTp), 'map', {
        iconUrl: './ui/gathering.png',
      })
      dealGatherings(itemsGatherableLimited, 'limited', tFn('recomm_process.group.time_limited_gathering', insituTp), 'start-time', {
        iconUrl: './ui/gathering-limited.png',
      })
    } else {
      dealGatherings(itemsGatherableCommon, 'common', tFn('recomm_process.group.gather_common_with_job', insituTp), 'map')
      dealGatherings(itemsGatherableLimited, 'limited', tFn('recomm_process.group.gather_time_limited_with_job', insituTp), 'start-time')
    }
    if (aethersands.length) {
      groups.push({
        type: 'aethersand',
        title: tFn('recomm_process.group.aethersand'),
        icon: './ui/reduce.png',
        items: aethersands,
      })
    }
    if (itemsTradable.length) {
      groups.push({
        type: 'trade-tomescript',
        title: tFn('recomm_process.group.trade'),
        icon: './ui/important-item.png',
        items: itemsTradable,
      })
    }
    if (itemsOtherCollectable.length) {
      groups.push({
        type: 'other',
        title: tFn('recomm_process.group.other'),
        icon: './ui/bag.png',
        items: itemsOtherCollectable,
      })
    }
    dealCraftings(itemsPrePrePrecraft, 'prepreprecraft', tFn('recomm_process.group.pre_pre_precraft', insituTp))
    dealCraftings(itemsPrePrecraft, 'preprecraft', tFn('recomm_process.group.pre_precraft', insituTp))
    dealCraftings(itemsPrecraft, 'precraft', tFn('recomm_process.group.precraft', insituTp))
    dealCraftings(itemsTarget, 'target', tFn('recomm_process.group.craft', insituTp))

    return groups
  }

  return {
    doCal,
    calItems,
    calGearSelections,
    getRecipeMap,
    getPatchData,
    getSpecialItems,
    getFoodAndTincs_v2,
    getLimitedGatherings,
    getStatementData,
    getProStatementData,
    calRecommProcessData,
    calRecommProcessGroups,
  }
}
