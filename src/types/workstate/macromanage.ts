import type { XivCraftAction } from '@/assets/data'
import {
  assignDefaults,
  deepCopy
} from '@/tools'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo } from '@/types/item'

export const _VAR_TAG_MAXLEN = 5
export const _VAR_REMARK_MAXLINE = 3
export const _VAR_RELATEITEM_MAXLEN = 99
export const _VAR_TABLESHOW_RELATEITEM_MAXLEN = 3
export const _VAR_MACRO_MAXAMOUNT = 500
/** 常用标签预设的最大数量 */
export const _VAR_PRESET_TAG_MAXAMOUNT = 8
/** 常用制作属性要求预设的最大数量 */
export const _VAR_PRESET_CREQ_MAXAMOUNT = 5

export interface CraftRequirements {
  /** 作业精度 */
  craftsmanship?: number,
  /** 加工精度 */
  control?: number,
  /** 制作力 */
  cp?: number,
}
export type StrictCraftRequirements = {
  [K in keyof Required<CraftRequirements>]: number
}

/** 配方难度 (用于在宏与物品之间反向匹配) */
export interface RecipeDifficulty {
  /** 耐久 */
  durability: number,
  /** 难度 */
  progress: number,
  /** 品质 */
  quality: number,
}

export interface RecordedCraftMacro {
  id: number,
  name: string,
  remark: string,
  /** 关联的物品 (数据库里没有的物品以字符串形式存储名称) */
  relateItems: (number|string)[],
  /** 用户自定义标签 */
  tags: string[],
  /** 此生产宏的属性要求 */
  requirements: CraftRequirements,
  craftActions: number[],
  /** 关联物品的配方难度 */
  recipeDifficulties?: RecipeDifficulty[],
}
const defaultCraftMacro: RecordedCraftMacro = {
  id: -1,
  name: '',
  remark: '',
  relateItems: [],
  tags: [],
  requirements: {},
  craftActions: [],
  recipeDifficulties: [],
}
export const getDefaultCraftMacro = (id: number) => {
  const macro = deepCopy(defaultCraftMacro)
  macro.id = id
  return macro
}

/**
 * 从关联物品列表中提取所有可制作物品的配方难度并去重
 * @param relateItems 关联物品ID或名称列表
 */
export const extractRecipeDifficulties = (relateItems: (number | string)[]): RecipeDifficulty[] => {
  const result: RecipeDifficulty[] = []
  for (const item of relateItems) {
    if (typeof item === 'number') {
      const itemInfo = getItemInfo(item)
      if (itemInfo?.craftRequires?.length && itemInfo?.craftInfo) {
        const { durability, progress, quality } = itemInfo.craftInfo
        if (durability && progress && quality) {
          const exists = result.some(
            d => d.durability === durability && d.progress === progress && d.quality === quality
          )
          if (!exists) {
            result.push({ durability, progress, quality })
          }
        }
      }
    }
  }
  return result
}

/**
 * 准备宏数据以保存。处理默认名称、requirements 的清零逻辑及配方难度提取。
 * @param macro 宏对象
 * @param defaultName 当 name 为空时使用的默认名称
 */
export const prepareMacroForSave = (macro: RecordedCraftMacro, defaultName: string) => {
  if (!macro.name) macro.name = defaultName
  if (!macro.requirements.craftsmanship) delete macro.requirements.craftsmanship
  if (!macro.requirements.control) delete macro.requirements.control
  if (!macro.requirements.cp) delete macro.requirements.cp
  if (macro.relateItems) {
    macro.recipeDifficulties = extractRecipeDifficulties(macro.relateItems)
  }
}

export interface CraftMacroRow {
  id: number,
  name: string,
  remark: string,
  /** 关联的物品 */
  relateItems: (ItemInfo|string)[],
  /** 用户自定义标签 */
  tags: string[],
  /** 此生产宏的属性要求 */
  requirements: Omit<CraftRequirements, 'cp'> & { cp: number },
  craftActions: XivCraftAction[],
  /** 关联物品的配方难度 */
  recipeDifficulties?: RecipeDifficulty[],
}

export interface WorkState {
  searchKeyword: string;
  macroItemLanguage: "zh" | "en" | "ja";
  recordIndex: number;
  recordedCraftMacros: RecordedCraftMacro[];
  presetTags: string[];
  presetCReqs: StrictCraftRequirements[];
}
export const defaultWorkState: WorkState = {
  searchKeyword: '',
  macroItemLanguage: 'zh',
  recordIndex: 1,
  recordedCraftMacros: [],
  presetTags: [],
  presetCReqs: [],
}

export const fixWorkState = (state?: WorkState) : WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  if (_state.recordedCraftMacros) {
    _state.recordedCraftMacros.forEach(macro => {
      if (!macro.recipeDifficulties) {
        macro.recipeDifficulties = extractRecipeDifficulties(macro.relateItems || [])
      }
    })
  }
  return _state
}