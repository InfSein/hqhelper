import type { ApiHistoryInfo, ApiListInfo } from "../api/universalis"

export const ItemPriceApiVersion = 3
export interface ItemPriceInfo {
  itemID: number
  worldID: number
  worldName: string
  currentAveragePriceNQ: number
  currentAveragePriceHQ: number
  averagePriceNQ: number
  averagePriceHQ: number
  minPriceNQ: number
  minPriceHQ: number
  maxPriceNQ: number
  maxPriceHQ: number
  /** 代表此缓存数据记录时，程序相关代码的版本。
   * 最初版本的缓存值为 `undefined`, 之后递增1。
   * 在进行破坏性变更时会提升此值，以方便程序判断是否需要重新加载缓存数据。
   */
  v?: number
  /** 更新时间，毫秒级时间戳 */
  updateTime: number
  // * 以下是 v2 之后添加的字段
  /** 交易板的挂牌均价 (仅计入前10条) */
  marketPriceNQ?: number
  /** 交易板的挂牌均价 (仅计入前10条) */
  marketPriceHQ?: number
  /** 交易板当前最低价 */
  marketLowestPriceNQ?: number
  /** 交易板当前最低价 */
  marketLowestPriceHQ?: number
  /** 最近成交价格 (仅计入前5条) */
  purchasePriceNQ?: number
  /** 最近成交价格 (仅计入前5条) */
  purchasePriceHQ?: number
  // * 以下是 v3 之后添加的字段
  /** 是否列出了所有交易记录 */
  listAll?: boolean
  /** 当前寄售列表 */
  marketListing?: ApiListInfo[]
  /** 最近成交历史 */
  purchaseHistory?: ApiHistoryInfo[]
}