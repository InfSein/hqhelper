import type { ItemInfo } from "@/tools/item"

/**
 * 计算引擎输入条目
 */
export interface CalInputEntry {
  /** 道具ID */
  itemId: number,
  /** 数量 */
  count: number,
  /** 配方ID */
  recipeId: number,
  /** 是否已勾选/已完成 */
  checked: boolean,
  /** (可选)特殊跳过标记 */
  skip?: boolean,
}

/**
 * 递归计算展开中单项物品的信息
 */
export interface CalResultItem {
  id: number
  rid?: number | number[]
  name: string[]
  icon: number
  desc: string[]
  uc: number
  need: number
  mkc: number
  pc?: number
  checked?: boolean
  job?: number
}

/**
 * 递归配方展开计算的完整结果结构
 */
export interface CalResult {
  /** 目标制品队列 */
  ls: Record<string, CalResultItem>
  /** 1级材料（直接素材） */
  lv1: Record<string, CalResultItem>
  /** 2级材料（半成品下级素材） */
  lv2: Record<string, CalResultItem>
  /** 3级材料 */
  lv3: Record<string, CalResultItem>
  /** 4级材料 */
  lv4: Record<string, CalResultItem>
  /** 5级材料 */
  lv5: Record<string, CalResultItem>
  /** 基础素材汇总统计 */
  lvBase: Record<string, CalResultItem>
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
