import type { ItemInfo } from '@/types/item'

import {
  XivUnpackedGatheringItems,
  XivUnpackedItems, type XivUnpackedItem,
  XivUnpackedPlaceNames,
  XivUnpackedRecipes,
  XivUnpackedTerritories,
  XivItemTypes,
  XivGatheringBonuses,
  XivUnpackedTradeMap,
  XivUnpackedCollectableSubmissions,
  HqData,
  type XivPatchVer,
} from '@/assets/data'
import {
  XivMaps,
  calculatePosVal,
  getNearestAetheryte,
} from '@/tools/game/map'
import { deepCopy, range } from '@/tools'
import { getImgCdnUrl } from '@/tools/game'
import type { RecipeCalculateResultItem } from '@/types/core'

/**
 * 获取可以精选的道具映射表
 * key: 精选所得道具的 itemID, value: 精选来源的 itemID 数组
 */
const getReduceMap = () => {
  const map: Record<number, number[]> = {}
  for (const patch in HqData.patches) {
    const reduces = HqData.patches[patch as XivPatchVer]?.reduces
    Object.entries(reduces ?? {}).forEach(([k, v]) => {
      map[Number(k)] = v
    })
  }
  return map
}

/**
 * 获取反转的精选映射表
 * key: 精选来源的 itemID, value: 精选所得道具的 itemID
 */
const getReduceMapReverted = () => {
  const map: Record<number, number> = {}
  for (const patch in HqData.patches) {
    const reduces = HqData.patches[patch as XivPatchVer]?.reduces
    Object.entries(reduces ?? {}).forEach(([k, v]) => {
      v.forEach(v2 => {
        map[v2] = Number(k)
      })
    })
  }
  return map
}

const reduceMap = getReduceMap()
const revertedReduceMap = getReduceMapReverted()

/**
 * 获取素材物品
 * 素材物品指可以用来制作其他物品的道具
 */
export const getMaterialItems = () => {
  return [
    ...range(2, 19), // 碎晶／水晶／晶簇
    ...new Set(
      Object.values(XivUnpackedRecipes)
        .flatMap(recipe => recipe.materials.filter((_, i) => i % 2 === 0))
    )
  ].sort((a, b) => a - b);
}

/**
 * 获取物品名称映射表
 * @映射规则 `item_name` -> `item_id`
 * @注释 `item_name` 包括中英日文版本，道具出现重复时会覆盖
 */
export const getItemNameRevertMap = () => {
  const map = new Map<string, number>()
  for (const item of Object.values(XivUnpackedItems)) {
    map.set(item.name[0], item.id)
    map.set(item.name[1], item.id)
    map.set(item.name[2], item.id)
  }
  return map
}

/**
 * 对给定物品数组进行排序
 * @param items 要排序的物品数组
 * @param by 排序方式
 *  - recipeOrder: 按照 `游戏内制作笔记` 的优先级进行排序
 *  - recipeOrderSearch: 按照 `游戏内制作笔记搜索` 的优先级进行排序 (ID升序)
 *  - itemId: 按照 `id` 进行升序排序
 * @returns 排序后的物品数组
 */
export const sortItems = (items: ItemInfo[], by: "recipeOrder" | "recipeOrderSearch" | "itemId") => {
  if (by === 'recipeOrder') {
    return items.sort((a, b) => 
      (a.craftInfo.craftLevel - b.craftInfo.craftLevel) ||
      (a.craftInfo.starCount - b.craftInfo.starCount) ||
      (a.craftInfo.rLv - b.craftInfo.rLv) ||
      (a.uiTypeOrder - b.uiTypeOrder) ||
      (a.sortOrder - b.sortOrder) ||
      (a.id - b.id)
    )
  } else {
    return items.sort((a, b) => a.id - b.id)
  }
}


/**
 * 获取道具信息
 * @param item 物品ID或是`nbb-cal`传入的物品信息
 * @returns 处理后的道具信息
 */
export const getItemInfo = (item: `${number}` | number | RecipeCalculateResultItem) => {
  // * 尝试从items表中获取物品完整信息
  let itemID = 0, itemAmount = 0
  if (typeof item === 'number' || typeof item === 'string') {
    itemID = Number(item)
  } else {
    itemID = Number(item.id)
    itemAmount = item.need
  }

  let _item : XivUnpackedItem = {
    id: 0,
    need: 0,
    icon: -1,
    name: ['','',''],
    desc: ['','',''],
    uc: -1,
    pc: -1,
    mkc: -1,
    rids: [], ilv: -1, sc: 0, so: 0, hqable: false, rarity: 0,
    dye: 0, act: 0, tradable: false, collectable: false, reduce: false,
    elv: 0, ms: 0, bpm: [], spm: [], 
    jobs: 0, jd: false, p: '', apm: []
  }

  let itemValid = true
  if (itemID) {
    if (XivUnpackedItems?.[itemID]) {
      _item = deepCopy(XivUnpackedItems?.[itemID])
    } else {
      itemValid = false
      console.log('[开发提示] 此物品在items表中缺失:', item)
    }
    _item.id = itemID
  }

  // * 组装ItemInfo的基本参数
  const itemInfo = {
    id: _item.id,
    valid: itemValid,
    amount: itemAmount
  } as ItemInfo
  if (_item.name.length !== 3 || _item.desc.length !== 3) {
    console.error('[getItemInfo] 数据不符合规范:', _item)
    return itemInfo
  }
  itemInfo.sortOrder = _item.so
  itemInfo.itemLevel = _item.ilv
  itemInfo.name_ja = _item.name[0]
  itemInfo.name_en = _item.name[1]
  itemInfo.name_zh = _item.name[2]
  itemInfo.descJA = _item.desc[0]
  itemInfo.descEN = _item.desc[1]
  itemInfo.descZH = _item.desc[2]
  itemInfo.classJobId = _item.jobs
  itemInfo.patch = _item.p || '???'
  itemInfo.hqable = _item.hqable
  itemInfo.tradable = _item.tradable && !_item.collectable
  itemInfo.collectable = _item.collectable

  // * 组装物品图标URL
  itemInfo.iconUrl = getImgCdnUrl(_item.icon)
  itemInfo.hqIconUrl = getImgCdnUrl(_item.icon, true)

  // * 尝试根据道具的UI类型ID获取类型名称和图标URL
  const typeMap = XivItemTypes
  const itemType : number = _item.uc
  if (typeMap?.[itemType]) {
    itemInfo.uiTypeId = itemType
    itemInfo.uiTypeOrder = typeMap[itemType].order[0] * 256 + typeMap[itemType].order[1]
    itemInfo.uiTypeNameJA = typeMap[itemType].name[0]
    itemInfo.uiTypeNameEN = typeMap[itemType].name[1]
    itemInfo.uiTypeNameZH = typeMap[itemType].name[2].replace(/（/, '(').replace(/）/, ')')
    itemInfo.uiTypeIconUrl = getImgCdnUrl(typeMap[itemType].icon)
  }

  // * 组装物品特殊属性
  itemInfo.attrsProvided = []
  if (_item.bpm?.length) {
    _item.bpm.forEach(sp => {
      const attr = []
      attr.push(sp[0])
      attr.push(sp[1])
      const hqAttr = (sp.length > 2 && sp[2]) ? sp[1] + sp[2] : 0
      attr.push(hqAttr)
      itemInfo.attrsProvided.push(attr)
    })
  }
  itemInfo.tempAttrsProvided = _item.apm

  // * 组装物品精选信息
  itemInfo.canReduceFrom = []
  if (reduceMap[itemID]) {
    itemInfo.canReduceFrom = reduceMap[itemID]
  }
  if ((revertedReduceMap[itemID])) {
    itemInfo.canReduceTo = revertedReduceMap[itemID]
  }

  // * 组装物品采集信息
  const gatherData = XivUnpackedGatheringItems[itemID]
  if (gatherData) {
    const gatherJob = gatherData.type <= 1 ? 16 /*采矿*/ : 17 /*园艺*/
    let gntype_zh = '???', gntype_en = '???', gntype_ja = '???'
    switch (gatherData.type) {
      case 0: gntype_zh = '矿脉'; gntype_en = 'mineral deposit'; gntype_ja = '採掘'; break
      case 1: gntype_zh = '石场'; gntype_en = 'rocky outcrop'; gntype_ja = '砕岩'; break
      case 2: gntype_zh = '良材'; gntype_en = 'mature tree'; gntype_ja = '伐採'; break
      case 3: gntype_zh = '草场'; gntype_en = 'lush vegetation'; gntype_ja = '草刈'; break
    }
    const nodeLevel = gatherData.pointLevel
    gntype_zh = nodeLevel + '级' + '★'.repeat(gatherData.star) + gntype_zh
    gntype_en = 'Lv ' + nodeLevel + '★'.repeat(gatherData.star) + ' ' + gntype_en
    gntype_ja = 'レベル' + nodeLevel + '★'.repeat(gatherData.star) + gntype_ja
    const territoryID = gatherData.territory
    if (territoryID && XivUnpackedTerritories[territoryID]) {
      const territoryData = XivUnpackedTerritories[territoryID]
      const placeID = territoryData[2]
      const gatherPlaceData = XivUnpackedPlaceNames[placeID]
      if (gatherPlaceData) {
        const posX = Number(gatherData!.coords!.x)
        const posY = Number(gatherData!.coords!.y)
        const posVal = calculatePosVal(posX, posY)
        itemInfo.gatherInfo = {
          jobId: gatherJob,
          level: gatherData.level,
          nodelevel: nodeLevel,
          star: gatherData.star,
          placeID: placeID,
          placeNameZH: gatherPlaceData[2],
          placeNameJA: gatherPlaceData[0],
          placeNameEN: gatherPlaceData[1],
          gntype_zh, gntype_en, gntype_ja,
          posX, posY, posVal,
          timeLimitInfo: [],
          timeLimitDescription: '',
          difficulty: [gatherData.difficulty[0], gatherData.difficulty[1]],
          requirement: gatherData.requirement,
          bonuses: gatherData.bonuses.map(bonus => {
            const [condi, condiVal, bonusId, bonusVal] = bonus
            const r = (s: string) => s.replace(/{val1}/g, bonusVal.toString())
            return {
              condition: {
                attribute: condi === 19 ? 10 : condi + 58,
                value: condiVal
              },
              bonus: {
                text_zh: r(XivGatheringBonuses[bonusId].text_zh),
                text_en: r(XivGatheringBonuses[bonusId].text_en),
                text_ja: r(XivGatheringBonuses[bonusId].text_ja),
              }
            }
          })
        };
        if (gatherData.folkloreBook) {
          itemInfo.gatherInfo.folkloreId = gatherData.folkloreBook
        }
        if (XivMaps[placeID]) {
          itemInfo.gatherInfo.recommAetheryte = getNearestAetheryte(XivMaps[placeID], itemInfo.gatherInfo.posX, itemInfo.gatherInfo.posY)
        }
        const timelimitdesc : string[] = [];
        [1,2,3].forEach(i => {
          if (gatherData?.popTime) {
            const index = i as 1|2|3
            const start = gatherData.popTime?.[`start${index}`]
            let end = gatherData.popTime?.[`end${index}`]
            if (end === '00:00') end = '24:00'
            if (start && end && start !== '--:--' && end !== '--:--') {
              itemInfo.gatherInfo.timeLimitInfo.push({ start, end })
              timelimitdesc.push(`${start.split(':')[0]}~${end.split(':')[0]}`)
            }
          }
        });
        if (timelimitdesc.length > 0) {
          itemInfo.gatherInfo.timeLimitDescription = 'ET ' + timelimitdesc.join('/')
        }
      }
    }
  }

  // * 组装物品配方
  itemInfo.craftRequires = []
  itemInfo.craftRequireCrystals = []
  if (_item.rids?.length) {
    const recipeID = _item.rids[0]
    const recipe = XivUnpackedRecipes[recipeID]
    if (recipe) {
      // console.log('item:', _item, '\nrecipe:', recipe, '\n')
      const items = recipe.materials
      if (items?.length % 2 === 0) {
        for (let ptr = 0; ptr < items.length; ptr += 2) {
          const requiredItemID = items[ptr]
          const requiredItemCount = items[ptr + 1]
          itemInfo.craftRequires.push({
            id: requiredItemID, count: requiredItemCount
          })
        }
      }

      const crystals = recipe.crystals
      if (crystals?.length % 2 === 0) {
        for (let ptr = 0; ptr < crystals.length; ptr += 2) {
          const requiredItemID = crystals[ptr]
          const requiredItemCount = crystals[ptr + 1]
          if (requiredItemID && requiredItemID !== -1) {
            itemInfo.craftRequireCrystals.push({
              id: requiredItemID, count: requiredItemCount
            })
          }
        }
      }

      itemInfo.craftInfo = {
        jobId: recipe.job + 8, // 解包配方的jobId是从0开始
        recipeId: recipeID,
        craftLevel: recipe.clv,
        yields: recipe.yields,
        starCount: recipe.star,
        rLv: recipe.rlv,
        qsable: recipe.qsable,
        hqable: recipe.hqable,
        durability: recipe.sp?.[2],
        progress: recipe.sp?.[0],
        quality: recipe.sp?.[1],
        thresholds: {
          craftsmanship: recipe.thresholds[0],
          control: recipe.thresholds[1]
        },
        qsThresholds: {
          craftsmanship: recipe.thresholds[2],
          control: recipe.thresholds[3]
        },
        suggestedCraftsmanship: recipe.thresholds[4],
        masterRecipeId: recipe.srb
      }
    }
  }

  itemInfo.isCrystal = itemInfo.uiTypeId === 59
  itemInfo.isAethersand = itemInfo.name_en.endsWith('Aethersand')

  // * 处理物品是钓鱼采集品的场合
  // 目前也没有数据，给个标识让人去饿猫鱼糕找吧！
  // 如果可以兑换，那一般不是钓鱼采集品(例如 [44174]ロイヤルロブスター)
  itemInfo.isFishingItem = !itemInfo.tradeInfo && itemType === 47

  // * 处理物品是否为家具/庭具
  itemInfo.isFurnishing = itemType === 57 || (itemType >= 65 && itemType <= 80)

  // * 组装物品兑换信息
  itemInfo.tradeInfo = XivUnpackedTradeMap[itemInfo.id]

  // * 组装物品收藏品交易信息
  const csd = XivUnpackedCollectableSubmissions[itemInfo.id]
  if (csd) {
    itemInfo.collectInfo = {
      levelMin: csd.levels[0],
      levelMax: csd.levels[1],
      rewardScrip: csd.rewardScrip,
      rewards: [],
    }
    for (let i = 0; i < csd.rewards.length; i++) {
      const currReward = csd.rewards[i]
      const nextReward = csd.rewards[i + 1]
      itemInfo.collectInfo.rewards.push({
        collectabilityMin: currReward[0],
        collectabilityMax: nextReward?.[0] ? nextReward[0]-1 : undefined,
        scripAmount: currReward[1],
      })
    }
  }

  // * 组装完毕，返回结果
  return itemInfo
}
