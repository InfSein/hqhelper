import type { ItemPriceInfo } from "@/types/item.price"
import type { UserConfigModel } from "./config-user"
import { deepCopy, assignDefaults } from "@/tools"
import type { ApiPriceHistoryInfo } from "@/types/api.universalis"

export const itemPriceTypes = [
  'averagePrice',
  'currentAveragePrice',
  'minPrice',
  'maxPrice',
  'marketLowestPrice',
  'marketPrice',
  'purchasePrice'
] as const

export type FuncConfigKey = "copy_macro" | "craft_macro" | "craft_statement" | "recomm_process" | "cost_benefit"
export type ItemPriceType = typeof itemPriceTypes[number]

export type MacroGenerateMode = 'singleLine' | 'multiLine'
export type WorkflowJoinMode = "accumulation" | "cover" | "overwrite"

export interface FuncConfigModel {
  // #region 在偏好设置弹窗中设置的配置项
  // * 复制宏
  /** 点击“复制宏”时直接复制 */
  macro_direct_copy: boolean
  /** 默认宏前缀 */
  macro_copy_prefix: string
  /** 宏生成模式 */
  macro_generate_mode: MacroGenerateMode

  // * 生产宏
  /** 在每个生产宏的开头使用 `锁定宏指令 (/macrolock)` */
  cmacro_use_macrolock: boolean
  /** 移除生产宏技能名两端的双引号 */
  cmacro_remove_quotes: boolean
  /** 过渡生产宏执行结束后要提醒的内容 */
  cmacro_transition_tipper_content: string
  /** 所有生产宏执行结束后要提醒的内容 */
  cmacro_end_tipper_content: string

  // * 制作报表
  /** 使用旧版本制作报表 */
  use_traditional_statement: boolean
  /** 制作报表不统计碎晶/水晶/晶簇 */
  statement_ignore_crystals: boolean
  /** 制作报表禁用高亮展示关联素材 */
  statement_no_highlights: boolean
  /** 专业版制作报表：使用简洁模式展示物品 */
  prostate_concise_mode: boolean

  // * 推荐流程
  /** 推荐流程：显示物品详情 */
  processes_show_item_details: boolean
  /** 推荐流程：合并采集物品 */
  processes_merge_gatherings: boolean
  /** 推荐流程：制作物品排序规则 */
  processes_craftable_item_sortby: "itemId" | "recipeOrder" | "recipeOrderSearch"

  // * 物品价格
  /** 物品价格服务器 */
  universalis_server: string
  /** 物品价格类型 */
  universalis_priceType: ItemPriceType
  /** 物品价格有效期 */
  universalis_expireTime: number
  /** 导出Excel时导出成本/收益分析 */
  export_item_price: boolean
  /** 成本/收益分析：显示物品详情 */
  costandbenefit_show_item_details: boolean
  /** 成本/收益分析：物品排序规则 */
  costandbenefit_item_sort_by: "itemId" | "priceAsc" | "priceDesc" | "subTotalAsc" | "subTotalDesc"
  /** 在物品悬浮窗中展示物品价格 */
  universalis_showpriceinpop: boolean
  /** 在物品悬浮窗中展示的物品价格类型 */
  universalis_poppricetypes: ItemPriceType[]
  // #endregion

  // #region 在其他弹窗中设置的配置项
  // * 背包库存
  /** 在制作报表弹窗中启用背包库存自动同步 */
  inventory_statement_enable_sync: boolean
  /** 在工作流中启用背包库存手动同步 */
  inventory_workflow_enable_sync: boolean
  /** 在工作流中启用背包库存反向同步 */
  inventory_workflow_enable_sync_reverse: boolean
  /** 对不在库存中物品的处理方式 */
  inventory_other_items_way: "ignore" | "clear"
  /** 反向同步模式 */
  inventory_sync_reverse_mode: "loose" | "strict" | "overwrite"
  /** 用户库存数据 key:item_id, val:amount */
  inventory_data: Record<number, number>
  // #endregion

  // #region 隐藏的配置项
  workflow_default_join_mode: WorkflowJoinMode
  workflow_default_join_target: number
  // #endregion

  // #region 缓存
  cache_item_prices: Record<number, ItemPriceInfo>
  cache_item_price_histories: Record<number, ApiPriceHistoryInfo>
  // #endregion
}

const defaultFuncConfig: FuncConfigModel = {
  // * 复制宏
  macro_direct_copy: false,
  macro_copy_prefix: '',
  macro_generate_mode: 'singleLine',
  // * 生产宏
  cmacro_use_macrolock: false,
  cmacro_remove_quotes: false,
  cmacro_transition_tipper_content: '',
  cmacro_end_tipper_content: '',
  // * 制作报表
  use_traditional_statement: false,
  statement_ignore_crystals: false,
  statement_no_highlights: false,
  prostate_concise_mode: false,
  // * 推荐流程
  processes_show_item_details: true,
  processes_merge_gatherings: true,
  processes_craftable_item_sortby: 'recipeOrder',
  // * 物品价格
  universalis_server: '陆行鸟',
  universalis_priceType: 'averagePrice',
  universalis_expireTime: 6 * 60 * 60 * 1000, // 默认6小时
  export_item_price: false,
  costandbenefit_show_item_details: false,
  costandbenefit_item_sort_by: 'itemId',
  universalis_showpriceinpop: true,
  universalis_poppricetypes: ['marketLowestPrice', 'purchasePrice'],
  // * 背包库存
  inventory_statement_enable_sync: false,
  inventory_workflow_enable_sync: false,
  inventory_workflow_enable_sync_reverse: false,
  inventory_other_items_way: 'ignore',
  inventory_sync_reverse_mode: 'loose',
  inventory_data: {},
  // * 隐藏的配置项
  workflow_default_join_mode: 'accumulation',
  workflow_default_join_target: 0,
  // * 缓存
  cache_item_prices: {},
  cache_item_price_histories: {},
}

export const fixFuncConfig = (config?: FuncConfigModel, userConfig?: UserConfigModel) => {
  // 处理特定环境下的设置项
  if (!config) {
    config = {} as FuncConfigModel
  }

  // 继承旧版本设置
  if (userConfig) {
    const _userConfig = userConfig as any
    config.macro_direct_copy ??= _userConfig.macro_direct_copy || defaultFuncConfig.macro_direct_copy
    config.macro_copy_prefix ??= _userConfig.macro_copy_prefix || defaultFuncConfig.macro_copy_prefix
    config.macro_generate_mode ??= _userConfig.macro_generate_mode || defaultFuncConfig.macro_generate_mode
    config.use_traditional_statement ??= _userConfig.use_traditional_statement || defaultFuncConfig.use_traditional_statement
    if (_userConfig.statement_show_item_details === false) {
      config.prostate_concise_mode ??= true
    }
    config.processes_show_item_details ??= _userConfig.processes_show_item_gatherdetails || defaultFuncConfig.processes_show_item_details
    config.universalis_server ??= _userConfig.universalis_server || defaultFuncConfig.universalis_server
    config.universalis_priceType ??= _userConfig.universalis_priceType || defaultFuncConfig.universalis_priceType
    config.universalis_expireTime ??= _userConfig.universalis_expireTime || defaultFuncConfig.universalis_expireTime
    config.cache_item_prices ??= deepCopy(_userConfig.cache_item_prices ?? {})
  }

  // 处理其他的设置项
  return assignDefaults(defaultFuncConfig, config || {}) as FuncConfigModel
}