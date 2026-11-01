import { useStore } from "@/store"
import type { ItemInfo } from '@/types/item'
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
        totalVal: total,
        hasValue,
        partial,
        itemsMap
      }
    }

    const costRes = calculateTotal(costItems, 'NQ')
    const benefitRes = calculateTotal(benefitItems, 'HQ')

    let benefitInfo = benefitRes.total
    let isBenefitPartial = benefitRes.partial

    if (store.funcConfig.costandbenefit_benefit_calculation_rule === 'net') {
      if (benefitRes.total === '???') {
        benefitInfo = '???'
      } else if (costRes.total === '???') {
        benefitInfo = '???'
      } else {
        const netTotal = benefitRes.totalVal - costRes.totalVal
        benefitInfo = Math.floor(netTotal).toLocaleString()
      }
      if (costRes.partial) {
        isBenefitPartial = true
      }
    }

    return {
      updateRequired,
      itemsCost: costRes.itemsMap,
      itemsBenefit: benefitRes.itemsMap,
      costInfo: costRes.total,
      benefitInfo,
      isCostPartial: costRes.partial,
      isBenefitPartial
    }
  }

  return {
    calCostAndBenefit,
  }
}

export default useItemPrice