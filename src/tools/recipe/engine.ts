import {
  XivUnpackedItems,
  XivUnpackedRecipes,
} from '@/assets/data'
import type { RecipeCalculateResult } from '@/types/core'

/**
 * 计算需要制作的次数 = ceil(需求量 / 单次产出)
 */
function calcCraftCount(need: number, yields: number): number {
  if (yields <= 0) return 0
  return Math.ceil(need / yields)
}

/**
 * 展开一层材料（包含水晶与常规素材）
 */
function expandMaterials(
  currentMap: Record<number, number>,
): Record<number, number> {
  const nextMap: Record<number, number> = {}

  for (const idStr in currentMap) {
    const id = Number(idStr)
    const need = currentMap[id]
    if (need <= 0) continue

    const item = XivUnpackedItems[id]
    if (!item?.rids?.length) continue

    const rid = item.rids[0]
    const recipe = XivUnpackedRecipes[rid]
    if (!recipe) continue

    const mkc = calcCraftCount(need, recipe.yields)
    if (mkc <= 0) continue

    // 展开水晶
    const shard = recipe.crystals
    for (let i = 0; i < shard.length; i += 2) {
      const shardId = shard[i]
      if (shardId <= 0) continue
      const count = mkc * shard[i + 1]
      nextMap[shardId] = (nextMap[shardId] ?? 0) + count
    }

    // 展开常规素材
    const material = recipe.materials
    for (let j = 0; j < material.length; j += 2) {
      const matId = material[j]
      if (matId <= 0) continue
      const count = mkc * material[j + 1]
      nextMap[matId] = (nextMap[matId] ?? 0) + count
    }
  }

  return nextMap
}

/**
 * 汇总基础素材（无配方的素材及水晶）
 */
function accumulateBaseMaterials(
  lvMaps: Record<number, number>[],
): Record<number, number> {
  const baseMap: Record<number, number> = {}

  for (const lvMap of lvMaps) {
    for (const idStr in lvMap) {
      const id = Number(idStr)
      const count = lvMap[id]
      if (count <= 0) continue

      const item = XivUnpackedItems[id]
      // 无配方的素材视为基础素材（水晶在 XivUnpackedItems 中 rids 为空）
      if (!item?.rids?.length) {
        baseMap[id] = (baseMap[id] ?? 0) + count
      }
    }
  }

  return baseMap
}

/**
 * 递归配方展开计算主函数
 * @param targets 待计算物品队列，key 为物品 ID，value 为需求数量
 * @returns 各层级物品数量映射结果
 */
export function doCal(
  targets: Record<number, number>,
): RecipeCalculateResult {
  // 提取顶层有效目标
  const ls: Record<number, number> = {}
  for (const idStr in targets) {
    const id = Number(idStr)
    const count = targets[id]
    if (count > 0) {
      ls[id] = count
    }
  }

  // 逐级展开 5 层素材
  const lvMaps: Record<number, number>[] = []
  let currentMap = ls
  for (let i = 0; i < 5; i++) {
    currentMap = expandMaterials(currentMap)
    lvMaps.push(currentMap)
  }

  // 汇总所有展开层级中的基础素材
  const lvBase = accumulateBaseMaterials(lvMaps)

  return {
    ls,
    lv1: lvMaps[0],
    lv2: lvMaps[1],
    lv3: lvMaps[2],
    lv4: lvMaps[3],
    lv5: lvMaps[4],
    lvBase,
  }
}

