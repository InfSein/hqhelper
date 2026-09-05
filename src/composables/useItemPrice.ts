import { useStore } from "@/store"
import type { ItemInfo } from "@/tools/item"
import { ItemPriceApiVersion, type ItemPriceInfo } from "@/types/item/price"

const useItemPrice = () => {
  const store = useStore()

  const calCostAndBenefit = (
    costItems: ItemInfo[],
    benefitItems: ItemInfo[],
  ) => {
    let updateRequired = false
    const priceCache = store.funcConfig.cache_item_prices
    const expiresAfter = Date.now() - store.funcConfig.universalis_expireTime
    const priceKey = store.funcConfig.universalis_priceType

    const cacheNotExpired = (item: ItemInfo) => {
      const priceInfo = priceCache[item.id]
      return priceInfo && priceInfo.updateTime > expiresAfter
        && priceInfo.v && priceInfo.v >= ItemPriceApiVersion
    }

    const calculateTotal = (items: ItemInfo[], priceType: 'NQ' | 'HQ') => {
      let total = 0
      let partial = false
      let hasValue = false
      const itemsMap: Record<number, { amount: number, price: ItemPriceInfo }> = {}

      items.forEach(item => {
        if (cacheNotExpired(item)) {
          const p = priceCache[item.id]
          itemsMap[item.id] = { amount: item.amount, price: p }
          const actualPriceType = (priceType === 'HQ' && !item.hqable) ? 'NQ' : priceType
          total += item.amount * (p[`${priceKey}${actualPriceType}`] ?? 0)
          hasValue = true
        } else if (item.tradable) {
          updateRequired = true
          partial = true
        }
      })

      let totalStr = Math.floor(total).toLocaleString()
      if (items.length > 0 && !hasValue) {
        totalStr = '???'; partial = false
      }

      return {
        total: totalStr,
        partial,
        itemsMap
      }
    }

    const costRes = calculateTotal(costItems, 'NQ')
    const benefitRes = calculateTotal(benefitItems, 'HQ')

    return {
      updateRequired,
      itemsCost: costRes.itemsMap,
      itemsBenefit: benefitRes.itemsMap,
      costInfo: costRes.total,
      benefitInfo: benefitRes.total,
      isCostPartial: costRes.partial,
      isBenefitPartial: benefitRes.partial
    }
  }

  return {
    calCostAndBenefit,
  }
}

export default useItemPrice