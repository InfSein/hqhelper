import type { ComputedRef, Ref } from 'vue'
import { useStore } from '@/store'
import { fixFuncConfig, type FuncConfigModel } from '@/models/config-func'
import { useDialog } from '@/tools/dialog'
import { handleGetPriceError } from '@/tools/error'
import type { StatementData } from '@/tools/use-fufu-cal'
import useItemPrice from './useItemPrice'
import { getItemPriceInfo } from '@/tools/item.price'

/**
 * 成本/收益分析
 */
export function useCostAndBenefit(statementData: ComputedRef<StatementData>) {
  const t = inject<(message: string, args?: any) => string>('t')!
  const funcConfig = inject<Ref<FuncConfigModel>>('funcConfig')!

  const store = useStore()
  const { alertError } = useDialog(t)
  const NAIVE_UI_MESSAGE = useMessage()
  const { calCostAndBenefit } = useItemPrice()

  const showModal = ref(false)
  const updatingPrice = ref(false)

  const costAndBenefit = computed(() => {
    return calCostAndBenefit(
      statementData.value.materialsLvBase,
      statementData.value.craftTargets
    )
  })

  const updateItemPrices = async () => {
    if (costAndBenefit.value.updateRequired) {
      updatingPrice.value = true
      try {
        const items: number[] = []
        statementData.value.craftTargets.forEach(item => {
          items.push(item.id)
        })
        statementData.value.materialsLvBase.forEach(item => {
          items.push(item.id)
        })
        const itemPrices = await getItemPriceInfo([...new Set(items)], funcConfig.value.universalis_server)
        const newConfig = funcConfig.value
        Object.keys(itemPrices).forEach(id => {
          const itemID = Number(id)
          newConfig.cache_item_prices[itemID] = itemPrices[itemID]
        })
        await store.setFuncConfig(fixFuncConfig(newConfig, store.userConfig))
      } catch (error: any) {
        const errMsg = handleGetPriceError(error, t)
        await alertError(t('common.message.get_price_failed') + '\n' + errMsg)
      }
      updatingPrice.value = false
    }
  }

  const openModal = async () => {
    if (updatingPrice.value) {
      NAIVE_UI_MESSAGE.info(t('common.loading'))
      return
    }
    await updateItemPrices()
    showModal.value = true
  }

  return {
    showModal,
    updatingPrice,
    costAndBenefit,
    updateItemPrices,
    openModal,
  }
}
