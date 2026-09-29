import type { ItemInfo } from '@/types/item'

/**
 * 递归配方展开计算的完整结果结构（物品ID -> 需求数量）
 */
export interface RecipeCalculateResult {
  /** 目标制品队列 */
  ls: Record<number, number>,
  /** 1级材料（直接素材） */
  lv1: Record<number, number>,
  /** 2级材料（半成品下级素材） */
  lv2: Record<number, number>,
  /** 3级材料 */
  lv3: Record<number, number>,
  /** 4级材料 */
  lv4: Record<number, number>,
  /** 5级材料 */
  lv5: Record<number, number>,
  /** 基础素材汇总统计 */
  lvBase: Record<number, number>,
}

/**
 * 报表物品分级数据
 */
export interface StatementData {
  craftTargets: ItemInfo[]
  materialsLv1: ItemInfo[]
  materialsLv2: ItemInfo[]
  materialsLv3: ItemInfo[]
  materialsLv4: ItemInfo[]
  materialsLv5: ItemInfo[]
  materialsLvBase: ItemInfo[]
}

/**
 * 进阶报表准备分类 key
 */
export type ProStatementPreparedKey = "craftTarget" | "materialsLv1" | "materialsLvBase"

/**
 * 进阶报表分组块数据
 */
export interface ProStatementBlock {
  id: string
  name: string
  items: Record<number, number>
  preparedKey: ProStatementPreparedKey
}
