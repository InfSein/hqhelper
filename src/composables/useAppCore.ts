import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import {
  HqData,
  XivJobs,
  type XivPatchVer,
} from '@/assets/data'
import type { GearSelections } from '@/types/game/gear'
import type { RecommItemGroup, ItemInfo } from '@/types/item'
import type {
  RecipeCalculateResult,
  ProStatementBlock,
  StatementData,
} from '@/types/core'
import { item_map2list, sortItems } from '@/tools/item'
import { classifyMaterials, groupCraftablesByJob } from '@/tools/item/classify'
import { getRecipeMap } from '@/tools/recipe/cache'
import { doCal } from '@/tools/recipe/engine'

// #region 内部辅助函数

/** 从物品数量表中扣除已准备的数量 */
function deductPrepared(
  items: Record<number, number>,
  prepared: Record<number, number>,
): Record<number, number> {
  const result = { ...items }
  for (const itemID in prepared) {
    const id = Number(itemID)
    if (result[id] === undefined) continue
    result[id] -= prepared[id]
  }
  return result
}

/** 过滤物品映射表中的水晶类道具（ID: 2~19） */
function filterCrystals(
  items: Record<number, number>,
  ignoreCrystal: boolean,
): Record<number, number> {
  if (!ignoreCrystal) return { ...items }
  const result: Record<number, number> = {}
  for (const itemID in items) {
    const id = Number(itemID)
    if (id >= 2 && id <= 19) continue
    result[id] = items[id]
  }
  return result
}

/** 将引擎计算结果转换为 UI 就绪的 StatementData */
function rawToStatementData(raw: RecipeCalculateResult): StatementData {
  return {
    craftTargets: item_map2list(raw.ls),
    materialsLv1: item_map2list(raw.lv1),
    materialsLv2: item_map2list(raw.lv2),
    materialsLv3: item_map2list(raw.lv3),
    materialsLv4: item_map2list(raw.lv4),
    materialsLv5: item_map2list(raw.lv5),
    materialsLvBase: item_map2list(raw.lvBase),
  }
}

interface ProcessClassifiedMaterials {
  gatherableCommon: ItemInfo[]
  gatherableLimited: ItemInfo[]
  aethersands: ItemInfo[]
  tradable: ItemInfo[]
  otherCollectable: ItemInfo[]
}

/**
 * 推荐流程专用：将基础素材按获取方式分类（排除水晶）
 * 推荐流程中不展示水晶分组，因此水晶在此显式过滤
 */
function classifyBaseMaterialsForProcess(lvBaseItems: ItemInfo[]): ProcessClassifiedMaterials {
  const classified = classifyMaterials(lvBaseItems)
  return {
    gatherableCommon: classified.gatherableCommon,
    gatherableLimited: classified.gatherableLimited,
    aethersands: classified.aethersands,
    tradable: classified.tomeScriptItems,
    otherCollectable: classified.other,
  }
}

/** 采集物品排序（按地图或限时开始时间） */
function sortGatherings(
  gathering: ItemInfo[],
  orderBy?: "map" | "start-time",
): void {
  if (orderBy === 'map') {
    gathering.sort((a, b) => {
      const aMap = a.gatherInfo?.placeID ?? 0
      const bMap = b.gatherInfo?.placeID ?? 0
      if (aMap === bMap) {
        return (a.gatherInfo?.posVal ?? 0) - (b.gatherInfo?.posVal ?? 0)
      }
      return aMap - bMap
    })
  } else if (orderBy === 'start-time') {
    gathering.sort((a, b) => {
      let startA = 99, startB = 99
      a.gatherInfo?.timeLimitInfo?.forEach(limit => {
        startA = Math.min(startA, Number(limit.start.split(':')[0]))
      })
      b.gatherInfo?.timeLimitInfo?.forEach(limit => {
        startB = Math.min(startB, Number(limit.start.split(':')[0]))
      })
      return startA - startB
    })
  }
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
   * 内部纯算法调用：直接调用计算引擎返回各层级数量映射
   */
  const calItemsRaw = (selections: Record<number, number>): RecipeCalculateResult => {
    return doCal(selections)
  }

  /**
   * 计算指定物品选择所需的素材统计
   * @param selections key: 道具 id, value: 数量
   * @returns UI 就绪的分层 ItemInfo 数据
   */
  const calItems = (selections: Record<number, number>): StatementData => {
    const raw = calItemsRaw(selections)
    return rawToStatementData(raw)
  }

  /**
   * 计算指定装备选择所需的素材统计
   * @returns UI 就绪的分层 ItemInfo 数据
   */
  const calGearSelections = (
    input: GearSelections,
    patch: XivPatchVer = '7.0',
  ): StatementData | undefined => {
    const patchData = HqData.patches[patch]
    if (!patchData) {
      return undefined
    }
    const selections: Record<number, number> = {}

    for (const _gearKey in input) {
      const gearKey = _gearKey as keyof GearSelections
      const gear = input[gearKey] as Record<string, number>
      for (const jobId in gear) {
        if (gear[jobId] > 0) {
          const item = (patchData[gearKey] as Record<string, number> | undefined)?.[jobId]
          if (item) {
            selections[item] = (selections[item] ?? 0) + gear[jobId]
          } else if (item !== 0) {
            console.warn('wrong index?', gearKey, jobId)
          }
        }
      }
    }
    const raw = calItemsRaw(selections)
    return rawToStatementData(raw)
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
    const ignoreCrystal = store.funcConfig.statement_ignore_crystals

    // 构建制作目标数量表
    const targetItems: Record<number, number> = {}
    craftTargets.forEach(item => {
      targetItems[item.id] = item.amount
    })

    // 扣减已准备的制作目标
    const targetItemsForCal = deductPrepared(targetItems, itemsPrepared.craftTarget)

    // 计算一级素材
    const statisticsForLv1 = calItemsRaw(targetItemsForCal)
    const lv1Items = filterCrystals(statisticsForLv1.lv1, ignoreCrystal)

    // 扣减已准备的一级素材
    const lv1ItemsForCal = deductPrepared(lv1Items, itemsPrepared.materialsLv1)

    // 计算基础素材
    const statistics = calItemsRaw(lv1ItemsForCal)
    const baseItems = filterCrystals(statistics.lvBase, ignoreCrystal)

    // 一级素材中无配方的道具直接计入基础素材
    for (const itemID in lv1ItemsForCal) {
      const id = Number(itemID)
      if (!recipeMap[id]) {
        baseItems[id] ??= 0
        baseItems[id] += lv1ItemsForCal[id]
      }
    }

    // 扣减已准备的基础素材
    const baseItemsForCal = deductPrepared(baseItems, itemsPrepared.materialsLvBase)

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
    const craftTargets = item_map2list(targetItemsForCal)
    const lv1Items = item_map2list(lv1ItemsForCal)

    const statistics = calItemsRaw(lv1ItemsForCal)
    const lv2Map = statistics.lv1
    const lv3Map = statistics.lv2

    const lv2Items = item_map2list(lv2Map)
    const lv3Items = item_map2list(lv3Map)

    const lvBaseItems = item_map2list(baseItemsForCal)

    return {
      craftTargets,
      lv1Items,
      lv2Items,
      lv3Items,
      lvBaseItems,
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
    const groups: RecommItemGroup[] = []

    // 1. 基础素材分类（推荐流程专用：排除水晶）
    const classified = classifyBaseMaterialsForProcess(lvBaseItems)

    // 2. 半成品/成品按职业分组
    const itemsPrePrePrecraft = groupCraftablesByJob(lv3Items)
    const itemsPrePrecraft = groupCraftablesByJob(lv2Items)
    const itemsPrecraft = groupCraftablesByJob(lv1Items)
    const itemsTarget = groupCraftablesByJob(craftTargets)

    // 3. 组装采集分组
    const insituTp = { job: '{job}' }
    const pushGatheringGroups = (
      gathering: ItemInfo[],
      type: "common" | "limited",
      groupTitle: string,
      orderBy: "map" | "start-time",
      mergeJobs?: { iconUrl: string },
    ) => {
      if (!gathering?.length) return
      sortGatherings(gathering, orderBy)
      if (mergeJobs) {
        groups.push({
          type: `gather-${type}`,
          title: groupTitle,
          icon: mergeJobs.iconUrl,
          items: gathering,
        })
      } else {
        const byJob: Record<number, ItemInfo[]> = {
          16: [],
          17: [],
          18: [],
        }
        gathering.forEach(item => {
          const jobId = item.gatherInfo?.jobId
          if (jobId && byJob[jobId]) {
            byJob[jobId].push(item)
          }
        })
        ;([16, 17, 18]).forEach(jobid => {
          if (byJob[jobid].length) {
            groups.push({
              type: `gather-${type}`,
              title: groupTitle.replace('{job}', XivJobs[jobid][`job_name_${language_ui}`]),
              icon: XivJobs[jobid].job_icon_url,
              items: byJob[jobid],
            })
          }
        })
      }
    }

    if (store.funcConfig.processes_merge_gatherings) {
      pushGatheringGroups(
        classified.gatherableCommon,
        'common',
        t('recomm_process.group.common_gathering', insituTp),
        'map',
        { iconUrl: './ui/gathering.png' },
      )
      pushGatheringGroups(
        classified.gatherableLimited,
        'limited',
        t('recomm_process.group.time_limited_gathering', insituTp),
        'start-time',
        { iconUrl: './ui/gathering-limited.png' },
      )
    } else {
      pushGatheringGroups(
        classified.gatherableCommon,
        'common',
        t('recomm_process.group.gather_common_with_job', insituTp),
        'map',
      )
      pushGatheringGroups(
        classified.gatherableLimited,
        'limited',
        t('recomm_process.group.gather_time_limited_with_job', insituTp),
        'start-time',
      )
    }

    // 4. 组装非采集获取组
    if (classified.aethersands.length) {
      groups.push({
        type: 'aethersand',
        title: t('recomm_process.group.aethersand'),
        icon: './ui/reduce.png',
        items: classified.aethersands,
      })
    }
    if (classified.tradable.length) {
      groups.push({
        type: 'trade-tomescript',
        title: t('recomm_process.group.trade'),
        icon: './ui/important-item.png',
        items: classified.tradable,
      })
    }
    if (classified.otherCollectable.length) {
      groups.push({
        type: 'other',
        title: t('recomm_process.group.other'),
        icon: './ui/bag.png',
        items: classified.otherCollectable,
      })
    }

    // 5. 组装制作分组
    const pushCraftingGroups = (
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

    pushCraftingGroups(itemsPrePrePrecraft, 'prepreprecraft', t('recomm_process.group.pre_pre_precraft', insituTp))
    pushCraftingGroups(itemsPrePrecraft, 'preprecraft', t('recomm_process.group.pre_precraft', insituTp))
    pushCraftingGroups(itemsPrecraft, 'precraft', t('recomm_process.group.precraft', insituTp))
    pushCraftingGroups(itemsTarget, 'target', t('recomm_process.group.craft', insituTp))

    return groups
  }

  return {
    calItems,
    calGearSelections,
    getProStatementData,
    calRecommProcessData,
    calRecommProcessGroups,
  }
}
