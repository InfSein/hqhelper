import { XivJobs } from '@/assets/data'
import type { RecommItemGroup } from '@/types/item'
import { deepCopy } from '.'
import { getItemInfo, type ItemInfo } from "./item"
import { useNbbCal } from "./use-nbb-cal"
import { useStore } from '@/store'

export interface StatementData {
  craftTargets: ItemInfo[];
  materialsLv1: ItemInfo[];
  materialsLv2: ItemInfo[];
  materialsLv3: ItemInfo[];
  materialsLv4: ItemInfo[];
  materialsLv5: ItemInfo[];
  materialsLvBase: ItemInfo[];
}
export type ProStatementPreparedKey = "craftTarget" | "materialsLv1" | "materialsLvBase"
export interface ProStatementBlock {
  id: string;
  name: string;
  items: Record<number, number>;
  preparedKey: ProStatementPreparedKey;
}

export function useFufuCal() {
  const store = useStore()
  const t = inject<(message: string, args?: any) => string>('t')!

  const calItems = (selections: Record<number, number>) => {
    const { calItems } = useNbbCal()
    return calItems(selections)
  }
  
  const getStatementData = (statistics: any) : StatementData => {
    const craftTargets : ItemInfo[] = []
    const materialsLv1 : ItemInfo[] = []
    const materialsLv2 : ItemInfo[] = []
    const materialsLv3 : ItemInfo[] = []
    const materialsLv4 : ItemInfo[] = []
    const materialsLv5 : ItemInfo[] = []
    const materialsLvBase : ItemInfo[] = []
    
    processStatistics(statistics.ls, craftTargets)
    processStatistics(statistics.lv1, materialsLv1)
    processStatistics(statistics.lv2, materialsLv2)
    processStatistics(statistics.lv3, materialsLv3)
    processStatistics(statistics.lv4, materialsLv4)
    processStatistics(statistics.lv5, materialsLv5)
    processStatistics(statistics.lvBase, materialsLvBase)

    return { craftTargets, materialsLv1, materialsLv2, materialsLv3, materialsLv4, materialsLv5, materialsLvBase }

    function processStatistics(_in: any, out: any[]) {
      const ignoreCrystal = store.funcConfig.statement_ignore_crystals
      for (const id in _in) {
        const item = getItemInfo(_in[id])
        if (ignoreCrystal && item.isCrystal) continue
        out.push(item)
      }
    }
  }

  const getProStatementData = (
    craftTargets: ItemInfo[],
    itemsPrepared: {
      craftTarget: Record<number, number>;
      materialsLv1: Record<number, number>;
      materialsLvBase: Record<number, number>;
    },
  ) => {
    const { getRecipeMap, calItems } = useNbbCal()
    const recipeMap = getRecipeMap()

    // 这里啥比了，现在要加一个过滤掉水晶的功能
    // 但是拿到的全是item_id而非ItemInfo，导致很难办
    // 这次先写死了来实现，后续还有要加的就tm重写
    const isCrystal = (itemid : number) => itemid >= 2 && itemid <= 19

    // 根据已准备物品计算的实际要显示的物品清单
    // xxxItems是显示的清单，xxxItemsForCal是用于计算的实际清单(减去已准备的数量)
    // 计算顺序：成品->直接素材->基础素材
    // 成品清单永远不变
    // 修改成品清单的已准备数量，会影响到制作素材：直接和制作素材：基础
    // 修改制作素材：直接，会影响到制作素材：基础

    const targetItems : Record<number, number> = {}
    Object.values(craftTargets).forEach(item => {
      targetItems[item.id] = item.amount
    })

    const targetItemsForCal : Record<number, number> = {}
    Object.values(craftTargets).forEach(item => {
      targetItemsForCal[item.id] = item.amount
    })
    Object.keys(itemsPrepared.craftTarget).forEach(itemID => {
      const id = Number(itemID)
      targetItemsForCal[id] -= itemsPrepared.craftTarget[id]
    })

    const lv1Items : Record<number, number> = {}
    const statisticsForLv1 = calItems(targetItemsForCal)
    Object.values(statisticsForLv1.lv1).forEach((calResult : any) => {
      const itemID : number = calResult.id
      const amount : number = calResult.need
      if (store.funcConfig.statement_ignore_crystals && isCrystal(itemID)) return
      lv1Items[itemID] = amount
    })

    const lv1ItemsForCal = deepCopy(lv1Items)
    Object.keys(itemsPrepared.materialsLv1).forEach(itemID => {
      const id = Number(itemID)
      if (!lv1ItemsForCal[id]) return
      lv1ItemsForCal[id] -= itemsPrepared.materialsLv1[id]
    })

    const baseItems : Record<number, number> = {}
    const statistics = calItems(lv1ItemsForCal)
    Object.values(statistics.lvBase).forEach((calResult : any) => {
      const itemID : number = calResult.id
      const amount : number = calResult.need
      if (store.funcConfig.statement_ignore_crystals && isCrystal(itemID)) return
      baseItems[itemID] = amount
    })
    // nbb计算模型目前会忽略掉制作目标(这里的话是直接素材列表)中没有配方的道具，这里对它们进行特殊处理
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

    const statementBlocks : ProStatementBlock[] = [
      {
        id: 'craft-target',
        name: t('statement.list.targets'),
        items: targetItems,
        preparedKey: 'craftTarget'
      },
      {
        id: 'material-lv1',
        name: t('statement.list.material.lv1'),
        items: lv1Items,
        preparedKey: 'materialsLv1'
      },
      /*
      {
        id: 'material-lv2',
        name: t('statement.list.material.lv2'),
        items: props.materialsLv2
      },
      {
        id: 'material-lv3',
        name: t('statement.list.material.lv3'),
        items: props.materialsLv3
      },
      */
      {
        id: 'material-lvBase',
        name: t('statement.list.material.lvbase'),
        items: baseItems,
        preparedKey: 'materialsLvBase'
      },
    ]

    return {
      targetItems, targetItemsForCal,
      lv1Items, lv1ItemsForCal,
      baseItems, baseItemsForCal,
      statementBlocks
    }
  }

  const calRecommProcessData = (
    targetItemsForCal: Record<number, number>,
    lv1ItemsForCal: Record<number, number>,
    baseItemsForCal: Record<number, number>
  ) => {
    const craftTargets = dealItemMapToItemList(targetItemsForCal)
    const lv1Items = dealItemMapToItemList(lv1ItemsForCal)

    // 根据1级素材计算出2/3级素材 (主要是考虑半成品套娃的情况，所以不需要多做处理)
    const lv2Map : Record<number, number> = {}
    const lv3Map : Record<number, number> = {}
    const statistics = calItems(lv1ItemsForCal)
    // 1级素材复算得到的1级素材就是需要的2级素材，2级素材就是需要的3级
    Object.values(statistics.lv1).forEach((calResult : any) => {
      const itemID : number = calResult.id
      const amount : number = calResult.need
      lv2Map[itemID] = amount
    })
    Object.values(statistics.lv2).forEach((calResult : any) => {
      const itemID : number = calResult.id
      const amount : number = calResult.need
      lv3Map[itemID] = amount
    })
    const lv2Items = dealItemMapToItemList(lv2Map)
    const lv3Items = dealItemMapToItemList(lv3Map)

    const lvBaseItems = dealItemMapToItemList(baseItemsForCal)

    return {
      craftTargets,
      lv1Items, lv2Items, lv3Items,
      lvBaseItems
    }

    function dealItemMapToItemList(itemMap: Record<number, number>) {
      const list : ItemInfo[] = []
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

  const calRecommProcessGroups = (
    craftTargets: ItemInfo[],
    lv1Items: ItemInfo[],
    lv2Items: ItemInfo[],
    lv3Items: ItemInfo[],
    lvBaseItems: ItemInfo[],
    processes_craftable_item_sortby: string,
    processes_merge_gatherings: boolean,
    language_ui: "zh" | "en" | "ja",
    t: (message: string, args?: any) => string
  ) => {
    const itemsGatherableCommon : ItemInfo[] = []
    const itemsGatherableLimited : ItemInfo[] = []
    const aethersands : ItemInfo[] = []
    let itemsTradable : ItemInfo[] = []
    const itemsOtherCollectable : ItemInfo[] = []
    const itemsPrePrePrecraft : Record<number, ItemInfo[]> = {}
    const itemsPrePrecraft : Record<number, ItemInfo[]> = {}
    const itemsPrecraft : Record<number, ItemInfo[]> = {}
    const itemsTarget : Record<number, ItemInfo[]> = {}
  
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
        // 部分道具同时具备可采集/精选和可兑换的属性，需要注意区分
        itemsTradable.push(item)
      } else {
        if (!item.isCrystal) {
          // 忽略水晶
          itemsOtherCollectable.push(item)
        }
      }
    })

    // 对部分组的物品进行排序
    itemsTradable = itemsTradable.sort((a, b) =>
      (a.tradeInfo!.costId - b.tradeInfo!.costId) ||
      (a.uiTypeOrder - b.uiTypeOrder) ||
      (a.sortOrder - b.sortOrder) ||
      (a.id - b.id)
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
  
    // 根据处理后的物品列表组装各个分组
    const groups : RecommItemGroup[] = []
    const dealGatherings = (
      gathering: ItemInfo[],
      type: "common" | "limited",
      groupTitle: string,
      orderBy?: "map" | "start-time",
      mergeJobs?: {
        iconUrl: string
      }
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
          items: gathering
        })
      } else {
        const itemsGatheredBy = {
          16: [], 17: [], 18: []
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
              items: itemsGatheredBy[jobid]
            })
          }
        });
      }
    }
    const dealCraftings = (
      craftings: Record<number, ItemInfo[]>,
      type: "target" | "precraft" | "preprecraft" | "prepreprecraft",
      groupTitle: string
    ) => {
      Object.keys(craftings).forEach(_jobID => {
        const jobId = Number(_jobID)
        const job = XivJobs[jobId]
        const items = craftings[jobId]
        // NOTE: 'recipeOrderSearch' is the same as 'itemId'.
        if (processes_craftable_item_sortby === 'recipeOrder') {
          items.sort((a, b) => 
            (a.craftInfo.craftLevel - b.craftInfo.craftLevel) ||
            (a.craftInfo.starCount - b.craftInfo.starCount) ||
            (a.craftInfo.rLv - b.craftInfo.rLv) ||
            (a.uiTypeOrder - b.uiTypeOrder) ||
            (a.sortOrder - b.sortOrder) ||
            (a.id - b.id)
          )
        }
        groups.push({
          type: `craft-${type}`,
          title: groupTitle.replace('{job}', job[`job_name_${language_ui}`]),
          icon: job.job_icon_url,
          items: items
        })
      })
    }

    // 新i18n框架不传值会直接把{job}清除掉
    // 所以这里做一个原地TP
    // 有点啥比，但是还有别的办法吗
    const insituTp = { job: '{job}' }
  
    if (processes_merge_gatherings) {
      dealGatherings(itemsGatherableCommon, 'common', t('recomm_process.group.common_gathering', insituTp), 'map', {
        iconUrl: './ui/gathering.png'
      })
      dealGatherings(itemsGatherableLimited, 'limited', t('recomm_process.group.time_limited_gathering', insituTp), 'start-time', {
        iconUrl: './ui/gathering-limited.png'
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
        items: aethersands
      })
    }
    if (itemsTradable.length) {
      groups.push({
        type: 'trade-tomescript',
        title: t('recomm_process.group.trade'),
        icon: './ui/important-item.png',
        items: itemsTradable
      })
    }
    if (itemsOtherCollectable.length) {
      groups.push({
        type: 'other',
        title: t('recomm_process.group.other'),
        icon: './ui/bag.png',
        items: itemsOtherCollectable
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
    /**
     * 获取 `查看报表` 需要的数据
     * @param statistics 通过 `nbb-cal` 计算获得的统计数据
     */
    getStatementData,
    getProStatementData,
    calRecommProcessData,
    calRecommProcessGroups
  }
}