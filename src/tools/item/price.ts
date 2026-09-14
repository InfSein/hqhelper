import type { ApiPriceHistoryInfo, ApiPriceInfo } from "@/types/api/universalis"
import { ItemPriceApiVersion, type ItemPriceInfo } from "@/types/item/price"
import { getUniversalisBatch } from "@/utils/api.universalis"

export const getItemPriceInfo = async (
  item: number | number[],
  server: string,
  listAll = false, // 是否列出所有交易记录。默认只取前十条以提升查询速度。
) : Promise<Record<number, ItemPriceInfo>> => {
  const result : Record<number, ItemPriceInfo> = {}
  const apiResponse = await getUniversalisBatch<ApiPriceInfo>(
    '', item, server, listAll ? ['listings=50'] : ['listings=10']
  )
  Object.values(apiResponse).forEach(apiPriceInfo => {
    result[apiPriceInfo.itemID] = parseApiPriceInfo(apiPriceInfo, listAll)
  })
  return result
}

export const getItemPriceHistory = async (
  item: number | number[],
  server: string,
) : Promise<Record<number, ApiPriceHistoryInfo>> => {
  return await getUniversalisBatch<ApiPriceHistoryInfo>(
    'history/', item, server, []
  )
}

const parseApiPriceInfo = (apiPriceInfo: ApiPriceInfo, listAll = false) => {
  const itemPriceInfo : ItemPriceInfo = {
    itemID: apiPriceInfo.itemID,
    worldID: apiPriceInfo.worldID,
    worldName: apiPriceInfo.worldName,
    currentAveragePriceNQ: apiPriceInfo.currentAveragePriceNQ,
    currentAveragePriceHQ: apiPriceInfo.currentAveragePriceHQ,
    averagePriceNQ: apiPriceInfo.averagePriceNQ,
    averagePriceHQ: apiPriceInfo.averagePriceHQ,
    minPriceNQ: apiPriceInfo.minPriceNQ,
    minPriceHQ: apiPriceInfo.minPriceHQ,
    maxPriceNQ: apiPriceInfo.maxPriceNQ,
    maxPriceHQ: apiPriceInfo.maxPriceHQ,
    v: ItemPriceApiVersion,
    updateTime: Date.now()
  }

  // #region v2
  let nq_quantity = 0, nq_total = 0, hq_quantity = 0, hq_total = 0
  apiPriceInfo.listings?.forEach(item => {
    if (item.hq) {
      hq_quantity += item.quantity
      hq_total += item.total
    } else {
      nq_quantity += item.quantity
      nq_total += item.total
    }
  })
  itemPriceInfo.marketPriceNQ = nq_quantity ? nq_total / nq_quantity : 0
  itemPriceInfo.marketPriceHQ = hq_quantity ? hq_total / hq_quantity : 0

  nq_quantity = 0; nq_total = 0; hq_quantity = 0; hq_total = 0
  apiPriceInfo.recentHistory?.forEach(item => {
    if (item.hq) {
      hq_quantity += item.quantity
      hq_total += item.total
    } else {
      nq_quantity += item.quantity
      nq_total += item.total
    }
  })
  itemPriceInfo.purchasePriceNQ = nq_quantity ? nq_total / nq_quantity : 0
  itemPriceInfo.purchasePriceHQ = hq_quantity ? hq_total / hq_quantity : 0

  let marketLowestPriceNQ = 0, marketLowestPriceHQ = 0
  apiPriceInfo.listings?.forEach(item => {
    if (item.hq) {
      if (marketLowestPriceHQ === 0 || item.pricePerUnit < marketLowestPriceHQ) {
        marketLowestPriceHQ = item.pricePerUnit
      }
    } else {
      if (marketLowestPriceNQ === 0 || item.pricePerUnit < marketLowestPriceNQ) {
        marketLowestPriceNQ= item.pricePerUnit
      }
    }
  })
  itemPriceInfo.marketLowestPriceNQ = marketLowestPriceNQ
  itemPriceInfo.marketLowestPriceHQ = marketLowestPriceHQ
  // #endregion

  // #region v3
  itemPriceInfo.listAll = listAll
  itemPriceInfo.marketListing = apiPriceInfo.listings
  itemPriceInfo.purchaseHistory = apiPriceInfo.recentHistory
  // #endregion

  return itemPriceInfo
}