import {
  XivUnpackedItems,
  XivUnpackedRecipes,
} from '@/assets/data'
import type {
  CalInputEntry,
  CalResult,
  CalResultItem,
} from '@/types/core'

/**
 * 将材料累加到结果映射表中
 */
function addMaterialToMap(
  reMap: Record<string, CalResultItem>,
  itemId: number,
  count: number,
  rids?: number[],
) {
  const item = XivUnpackedItems[itemId]
  if (!item) return

  const itemKey = String(itemId)
  if (reMap[itemKey]) {
    reMap[itemKey].need += count
  } else {
    reMap[itemKey] = {
      id: itemId,
      rid: rids ?? [],
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

/**
 * 处理顶层制作目标队列
 */
export function expandTopLevel(
  calMap: Record<string, CalInputEntry>,
  shipArr: number[] = [],
): Record<string, CalResultItem> {
  const result: Record<string, CalResultItem> = {}

  for (const id in calMap) {
    const entry = calMap[id]
    if (!entry) continue

    const numId = Number(id)
    if (shipArr.includes(numId)) continue
    // 特殊场景跳过标记
    if (entry.skip) continue

    const need = entry.count
    const recipeId = entry.recipeId
    const checked = entry.checked
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
export function expandMaterials(
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
    if (!hideCluster) {
      for (let i = 0; i < shard.length; i += 2) {
        const shardId = shard[i]
        if (shardId <= 0) continue
        addMaterialToMap(reMap, shardId, mkc * shard[i + 1], [])
      }
    }

    // 展开常规材料
    for (let j = 0; j < material.length; j += 2) {
      const itemId = material[j]
      if (shipArr.includes(Number(itemId))) continue
      const item = XivUnpackedItems[itemId]
      if (!item) continue
      addMaterialToMap(reMap, itemId, mkc * material[j + 1], item.rids)
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
export function accumulateBaseMaterials(
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
export function doCal(
  calMap: Record<string, CalInputEntry>,
  hideCluster = false,
  shipArr0: number[] = [],
  shipArr1: number[] = [],
  shipArr2: number[] = [],
  shipArr3: number[] = [],
  shipArr4: number[] = [],
): CalResult {
  const shipArrs = [shipArr1, shipArr2, shipArr3, shipArr4, []]
  const sumMap0 = expandTopLevel(calMap, shipArr0)

  const lvMaps: Record<string, CalResultItem>[] = []
  let currentMap = sumMap0
  for (let i = 0; i < 5; i++) {
    currentMap = expandMaterials(currentMap, hideCluster, shipArrs[i])
    lvMaps.push(currentMap)
  }

  let sumMap02: Record<string, CalResultItem> = {}
  for (const lvMap of lvMaps) {
    sumMap02 = accumulateBaseMaterials(lvMap, sumMap02)
  }

  return {
    ls: sumMap0,
    lv1: lvMaps[0],
    lv2: lvMaps[1],
    lv3: lvMaps[2],
    lv4: lvMaps[3],
    lv5: lvMaps[4],
    lvBase: sumMap02,
  }
}
