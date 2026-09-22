import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import {
  HqData,
  XivJobs,
  XivUnpackedGatheringItems,
  XivUnpackedItems,
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
import { getRecipeMap } from '@/tools/recipe/cache'
import { doCal } from '@/tools/recipe/engine'

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
      calMap[item] = {
        itemId,
        count,
        recipeId: recipeMap[itemId],
        checked: false,
      }
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
            out[item] = {
              itemId: item,
              count: gear[jobId],
              recipeId: recipeMap[item],
              checked: false,
            }
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
  const getFtData = () => {
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
  const getStatementData = (statistics: CalResult): StatementData => {
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

    function processStatistics(_in: Record<string, CalResultItem>, out: ItemInfo[]) {
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
  ) => {
    const language_ui = store.userConfig.language_ui

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
        if (store.funcConfig.processes_craftable_item_sortby === 'recipeOrder') {
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

    if (store.funcConfig.processes_merge_gatherings) {
      dealGatherings(itemsGatherableCommon, 'common', t('recomm_process.group.common_gathering', insituTp), 'map', {
        iconUrl: './ui/gathering.png',
      })
      dealGatherings(itemsGatherableLimited, 'limited', t('recomm_process.group.time_limited_gathering', insituTp), 'start-time', {
        iconUrl: './ui/gathering-limited.png',
      })
    } else {
      dealGatherings(itemsGatherableCommon, 'common', t('recomm_process.group.gather_common_with_job', insituTp), 'map')
      dealGatherings(itemsGatherableLimited, 'limited', t('recomm_process.group.gather_time_limited_with_job', insituTp), 'start-time')
    }
    if (aethersands.length) {
      groups.push({
        type: 'aethersand',
        title: t('recomm_process.group.aethersand'),
        icon: './ui/reduce.png',
        items: aethersands,
      })
    }
    if (itemsTradable.length) {
      groups.push({
        type: 'trade-tomescript',
        title: t('recomm_process.group.trade'),
        icon: './ui/important-item.png',
        items: itemsTradable,
      })
    }
    if (itemsOtherCollectable.length) {
      groups.push({
        type: 'other',
        title: t('recomm_process.group.other'),
        icon: './ui/bag.png',
        items: itemsOtherCollectable,
      })
    }
    dealCraftings(itemsPrePrePrecraft, 'prepreprecraft', t('recomm_process.group.pre_pre_precraft', insituTp))
    dealCraftings(itemsPrePrecraft, 'preprecraft', t('recomm_process.group.pre_precraft', insituTp))
    dealCraftings(itemsPrecraft, 'precraft', t('recomm_process.group.precraft', insituTp))
    dealCraftings(itemsTarget, 'target', t('recomm_process.group.craft', insituTp))

    return groups
  }

  return {
    calItems,
    calGearSelections,
    getPatchData,
    getSpecialItems,
    getFtData,
    getLimitedGatherings,
    getStatementData,
    getProStatementData,
    calRecommProcessData,
    calRecommProcessGroups,
  }
}
