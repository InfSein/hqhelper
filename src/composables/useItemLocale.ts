import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { XivAttributes, type XivJob, type XivUnpackedNpc } from '@/assets/data'
import { getPlaceNames } from '@/tools/game/map'
import type { ItemInfo } from '@/types/item'
import type { ItemPriceType } from '@/types/config/func'

export const useItemLocale = () => {
  const { t } = useLocale()
  const { itemLanguage, uiLanguage } = useConfig()

  /** 获取物品的当前语言名称 */
  const getItemName = (itemInfo: ItemInfo): string => {
    switch (itemLanguage.value) {
      case 'zh':
        return itemInfo.name_zh || '未翻译的物品'
      default:
        return itemInfo[`name_${itemLanguage.value}`]
    }
  }

  /** 获取物品副名称（其他语言） */
  const getItemSubName = (itemInfo: ItemInfo): string => {
    switch (itemLanguage.value) {
      case 'ja': return itemInfo.name_en
      case 'en': return itemInfo.name_ja
      case 'zh':
      default: return itemInfo.name_ja + ' / ' + itemInfo.name_en
    }
  }

  /** 获取物品UI类型的当前语言名称 */
  const getItemTypeName = (itemInfo: ItemInfo): string => {
    switch (itemLanguage.value) {
      case 'ja': return itemInfo.uiTypeNameJA
      case 'en': return itemInfo.uiTypeNameEN
      case 'zh':
      default: return itemInfo.uiTypeNameZH
    }
  }

  /** 获取职业的当前语言全名 */
  const getJobName = (jobInfo: XivJob): string => {
    switch (uiLanguage.value) {
      case 'ja': return jobInfo?.job_name_ja || t('common.unknown')
      case 'en': return jobInfo?.job_name_en || t('common.unknown')
      case 'zh':
      default: return jobInfo?.job_name_zh || t('common.unknown')
    }
  }

  /** 获取职业的当前语言短名（用于紧凑显示，如 ItemCell） */
  const getJobShortName = (jobInfo: XivJob): string => {
    switch (uiLanguage.value) {
      case 'en': return jobInfo?.short_name || t('common.unknown')
      case 'ja': return (jobInfo?.job_name_ja || t('common.unknown')).substring(0, 2)
      case 'zh':
      default: return (jobInfo?.job_name_zh || t('common.unknown')).substring(0, 2)
    }
  }

  /** 获取属性的当前语言名称 */
  const getAttrName = (attrId: number): string => {
    const attr = XivAttributes[attrId]
    if (!attr) return t('common.unknown')
    return attr[`name_${uiLanguage.value}`]
  }

  /** 获取采集地点的当前语言名称 */
  const getPlaceName = (itemInfo: ItemInfo): string | undefined => {
    switch (itemLanguage.value) {
      case 'ja': return itemInfo.gatherInfo?.placeNameJA
      case 'en': return itemInfo.gatherInfo?.placeNameEN
      case 'zh':
      default: return itemInfo.gatherInfo?.placeNameZH
    }
  }

  /** 根据地点 ID 获取当前语言地名 */
  const getPlaceNameById = (placeId: number): string => {
    const placeNames = getPlaceNames(placeId)
    switch (itemLanguage.value) {
      case 'ja': return placeNames.name_ja
      case 'en': return placeNames.name_en
      case 'zh':
      default: return placeNames.name_zh
    }
  }

  /** 获取 NPC 的当前语言名称 */
  const getNpcName = (npc: XivUnpackedNpc): string => {
    switch (itemLanguage.value) {
      case 'ja': return npc.name[0]
      case 'en': return npc.name[1]
      case 'zh':
      default: return npc.name[2] || npc.name[0]
    }
  }

  /** 获取 NPC 副名称（其他语言） */
  const getNpcSubName = (npc: XivUnpackedNpc): string => {
    switch (itemLanguage.value) {
      case 'ja': return npc.name[1]
      case 'en': return npc.name[0]
      case 'zh':
      default: return npc.name[0] + ' / ' + npc.name[1]
    }
  }

  /** 获取价格类型的显示名称 */
  const getPriceTypeName = (ptype: ItemPriceType): string => {
    switch (ptype) {
      case 'averagePrice': return t('preference.universalis_price_type.option.average')
      case 'currentAveragePrice': return t('preference.universalis_price_type.option.curr_average')
      case 'minPrice': return t('preference.universalis_price_type.option.min')
      case 'maxPrice': return t('preference.universalis_price_type.option.max')
      case 'purchasePrice': return t('preference.universalis_price_type.option.purchase_average.title')
      case 'marketLowestPrice': return t('preference.universalis_price_type.option.market_min.title')
      case 'marketPrice': return t('preference.universalis_price_type.option.market_average.title')
      default: return t('common.unknown')
    }
  }

  return {
    getItemName,
    getItemSubName,
    getItemTypeName,
    getJobName,
    getJobShortName,
    getAttrName,
    getPlaceName,
    getPlaceNameById,
    getNpcName,
    getNpcSubName,
    getPriceTypeName,
  }
}

export default useItemLocale
