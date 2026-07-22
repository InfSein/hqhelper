<script lang="ts" setup>
import {
  OpenInNewFilled,
  RefreshOutlined,
  TableViewFilled,
} from '@vicons/material'
import HqSwitcher from '@/components/ui/HqSwitcher.vue'
import ItemSpan from './ItemSpan.vue'
import ItemRemark from './ItemRemark.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import LocationSpan from '@/components/map/LocationSpan.vue'
import ItemSubmissionReward from './ItemSubmissionReward.vue'
import HelpButton from '@/components/ui/HelpButton.vue'
import {
  XivItemRemarks,
  XivJobs, type XivJob,
  XivAttributes
} from '@/assets/data'
import { useStore } from '@/store'
import type EorzeaTime from '@/utils/game.et.ts'
import { handleGetPriceError } from '@/tools/error'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import useConfig from '@/composables/useConfig.ts'
import { getItemPriceInfo } from '@/tools/item/price.ts'
import type { ItemPriceType } from '@/types/config/func.ts'
import ItemInfoHeader from './ItemInfoHeader.vue'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const currentET = inject<Ref<EorzeaTime>>('currentET')!
// const appMode = inject<Ref<"overlay" | "" | undefined>>('appMode') ?? ref('')
const showItemPriceDetail = inject<(items: ItemInfo[]) => void>('showItemPriceDetail')!

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const {
  uiLanguage, itemLanguage,
} = useConfig()

interface ItemPopProps {
  /** 道具信息 */
  itemInfo: ItemInfo

  /** 悬浮窗使用自定义宽度 */
  popUseCustomWidth?: boolean;
  /** 悬浮窗的自定义宽度，必须同时设置`popUseCustomWidth`才能生效 */
  popCustomWidth?: number;
  /** 悬浮窗的最大宽度 */
  popMaxWidth?: string;
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'

  /** 是否禁用物品信息提示框(可选,默认false) */
  disablePop?: boolean;

  /** 物品按钮所处容器的ID，在模态框等场景时必须传递，否则无法正常复制物品名 */
  containerId?: string
}
const props = defineProps<ItemPopProps>()

const showItemHqAttr = ref(true)
const popScrolling = ref(false)

onMounted(() => {
  if (!itemHasHQ.value) {
    showItemHqAttr.value = false
  }
})

const getJobName = (jobInfo: XivJob) => {
  switch (uiLanguage.value) {
    case 'ja':
      return jobInfo?.job_name_ja || t('common.unknown')
    case 'en':
      return jobInfo?.job_name_en || t('common.unknown')
    case 'zh':
    default:
      return jobInfo?.job_name_zh || t('common.unknown')
  }
}

const getItemName = () => {
  switch (itemLanguage.value) {
    case 'zh':
      return props.itemInfo.name_zh || '未翻译的物品'
    default:
      return props.itemInfo[`name_${itemLanguage.value}`]
  }
}
const getItemDescriptions = () => {
  let description = ''
  switch (itemLanguage.value) {
    case 'ja':
      description = props.itemInfo.descJA; break
    case 'en':
      description = props.itemInfo.descEN; break
    case 'zh':
    default:
      description = props.itemInfo.descZH
  }

  // * 处理特殊字符(好像只有E端有)
  // 处理颜色字符
  description = description.replace(/\{\{color\|id=(\d+)\|([^}]+)\}\}/g, (match, id, text) => {
    let color = ''
    if (id == 504) color = 'orange'

    if (color) {
      return `<span style="color: ${color}">${text}</span>`
    } else {
      return text
    }
  })
  // 处理斜体
  description = description.replace(/\{\{Italic\|([^}]*)\}\}/g, '<span class="italic">$1</span>')

  const descs = description.split('<br>')
  return `<p>${descs.join('</p><p>')}</p>`
}
const getItemTypeName = () => {
  switch (itemLanguage.value) {
    case 'ja':
      return props.itemInfo.uiTypeNameJA
    case 'en':
      return props.itemInfo.uiTypeNameEN
    case 'zh':
    default:
      return props.itemInfo.uiTypeNameZH
  }
}
const getAttrName = (attrId: number) => {
  const attr = XivAttributes[attrId]
  if (!attr) {
    return t('common.unknown')
  }
  return attr[`name_${uiLanguage.value}`]
}
const getPlaceName = () => {
  switch (itemLanguage.value) {
    case 'ja':
      return props.itemInfo.gatherInfo?.placeNameJA
    case 'en':
      return props.itemInfo.gatherInfo?.placeNameEN
    case 'zh':
    default:
      return props.itemInfo.gatherInfo?.placeNameZH
  }
}
const itemHasHQ = computed(() => {
  if (props.itemInfo.tempAttrsProvided?.length) {
    return props.itemInfo.tempAttrsProvided.every(subArr => subArr[1])
  } else {
    return props.itemInfo.attrsProvided.every(subArr => subArr[2] > 0)
  }
})
const itemTempAttrTexts = computed(() : string[] => {
  if (!props.itemInfo.tempAttrsProvided?.length) {
    return []
  }
  return props.itemInfo.tempAttrsProvided.map(attr => buildAttrText(attr, showItemHqAttr.value))

  function buildAttrText(attr: number[], hq: boolean) {
    const attrId = attr[0]
    const attrPercent = hq ? attr[4] : attr[2]
    const attrMax = hq ? attr[5] : attr[3]
    switch (attrId) {
      case 7: // 体力
      case 8: // 魔力
        return t('item.text.medicine_recovery_info', [getAttrName(attrId), attrPercent, attrMax])
      default:
        return `${getAttrName(attrId)} +${attrPercent}% ${t('common.quoted_maximum', attrMax)}`
    }
  }
})
const itemGatherDifficulty = computed(() => {
  if (!props.itemInfo.gatherInfo?.difficulty) return undefined

  const [diffGather, diffPerception] = props.itemInfo.gatherInfo.difficulty
  const diffText = diffGather !== diffPerception
    ? t('item.text.gathering_detail_type1', [diffGather, diffPerception])
    : t('item.text.gathering_detail_type2', [diffGather])
  
  const processThreshold = (threshold: { field: string; value: number; upstair?: boolean; }, keyval: number) => {
    const func = threshold.upstair ? Math.ceil : Math.floor
    return { ...threshold, value: func(threshold.value * keyval) }
  }
  const gatherThresholds = [
    {
      field: t('item.gather_threshold.must_gain'),
      value: 0.8,
    },
    ...(
      !props.itemInfo.collectable ? [
        {
          field: t('item.gather_threshold.yield_plus', [2]),
          value: 0.9,
        },
        {
          field: t('item.gather_threshold.yield_plus', [3]),
          value: 1.1,
        },
      ] : []
    ),
    ...(
      props.itemInfo.collectable ? [
        {
          field: t('item.gather_threshold.scour_base_gain', [200]),
          value: 0.95,
          upstair: true,
        },
        {
          field: t('item.gather_threshold.meticulous_rate', [25]),
          value: 1,
        },
      ] : []
    )
  ].map(threshold => processThreshold(threshold, diffGather))
  const perceptionThresholds = [
    ...(
      !props.itemInfo.collectable ? [
        {
          field: t('item.gather_threshold.boon_rate', [30]),
          value: 0.95,
          upstair: true,
        },
        {
          field: t('item.gather_threshold.boon_rate', [60]),
          value: 1.5,
          upstair: true,
        },
      ] : []
    ),
    ...(
      props.itemInfo.collectable ? [
        {
          field: t('item.gather_threshold.scrutiny_multi', [125]),
          value: 0.95,
          upstair: true,
        },
        {
          field: t('item.gather_threshold.intuition_rate', [40]),
          value: 1,
        },
      ] : []
    ),
  ].map(threshold => processThreshold(threshold, diffPerception))

  return {
    diffGather, diffPerception,
    diffText,
    gatherThresholds, perceptionThresholds,
  }
})
const itemCraftRequires = computed(() => {
  const requires : {
    id: number;
    count: number;
  }[] = []
  if (store.userConfig.item_pop_craft_show_crystals) {
    requires.push(...props.itemInfo.craftRequireCrystals)
  }
  requires.push(...props.itemInfo.craftRequires)
  return requires
})
const itemTailDescriptions = computed(() => {
  const descriptions : string[] = []
  // if (itemLanguage.value === 'zh') {
  //   if (props.itemInfo.usedZHTemp) {
  //     descriptions.push(t('item.text.zh_name_is_temp'))
  //   } else if (props.itemInfo.chsOffline) {
  //     descriptions.push(t('item.text.not_installed_in_chs'))
  //   }
  // }
  return descriptions
})
interface RenderedTradeCost {
  costId: number
  costCount: number
  receiveCount: number
  receive2Id?: number
  receive2Count?: number
  cost2Id?: number
  cost2Count?: number
  cost3Id?: number
  cost3Count?: number
  level: number // 嵌套层级，方便渲染缩进或分隔
}
const tradeCostList = computed(() => {
  const result: RenderedTradeCost[] = []
  let current = props.itemInfo.tradeInfo
  let level = 0

  while (current) {
    result.push({
      costId: current.costId,
      costCount: current.costCount,
      receiveCount: current.receiveCount,
      receive2Id: current.receive2Id,
      receive2Count: current.receive2Count,
      cost2Id: current.cost2Id,
      cost2Count: current.cost2Count,
      cost3Id: current.cost3Id,
      cost3Count: current.cost3Count,
      level
    })
    current = current.tradeAlter
    level++
  }

  return result
})
const timeCanGather = (timeLimit: {start: string, end: string}) => {
  try {
    const parseTime = (time: string) => time.split(':').reduce((acc, val, idx) => acc + parseInt(val) * [60, 1][idx], 0)
    const s = parseTime(timeLimit.start)
    const e = parseTime(timeLimit.end)
    const c = currentET.value.hour * 60 + currentET.value.minute
    if (c >= s && c <= e) {
      return t('item.text.timelimited_gatherable')
    }
  } catch (err) {
    console.error(err)
  }
  return ''
}

const openInMomola = () => {
  window.open(`https://fish.ffmomola.com/ng/#/wiki/fish/${props.itemInfo.id}`)
}
const openInAngler = () => {
  let lang : string = itemLanguage.value
  switch (lang) {
    case 'zh': lang = 'cn'; break
    case 'ja': lang = 'jp'; break
  }
  const name = getItemName()
  const domain = `https://${lang}.ff14angler.com/`
  window.open(`${domain}?search=${name}`)
}

const openInBestCraft = () => {
  window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${props.itemInfo?.craftInfo?.recipeId}`)
}

const itemPriceInfo = computed(() => {
  const priceInfo = store.funcConfig.cache_item_prices[props.itemInfo.id]
  const havePrice = !!priceInfo

  // 计算上次更新时间
  let lastUpdate = t('common.never'); let priceExpired = false
  if (priceInfo) {
    const lastUpdateTS = priceInfo.updateTime
    const diff = Math.floor((Date.now() - lastUpdateTS) / 1000)
    if (diff < 60) {
      lastUpdate = t('common.just_now')
    } else if (diff < 3600) {
      lastUpdate = t('common.val_minutes_ago', Math.floor(diff / 60))
    } else if (diff < 86400) {
      lastUpdate = t('common.val_hours_ago', Math.floor(diff / 3600))
    } else {
      lastUpdate = t('common.val_days_ago', Math.floor(diff / 86400))
    }
    priceExpired = (Date.now() - lastUpdateTS) > store.funcConfig.universalis_expireTime
  }

  // 组装各个类型的价格
  const prices = store.funcConfig.universalis_poppricetypes.map(priceType => {
    const priceNq = Math.floor(priceInfo?.[`${priceType}NQ`] ?? 0)
    const priceHq = Math.floor(priceInfo?.[`${priceType}HQ`] ?? 0)
    const tooltipForNoPrice = t('item.price.no_price') + '\n' + t('item.price.no_price_reason')
    const styleForNoPrice = 'cursor: help; text-decoration: underline dashed gray;'
    let priceStrNq = priceNq.toLocaleString(), priceStrHq = priceHq.toLocaleString()
    let tipNq = '', tipHq = '', styleNq = '', styleHq = ''
    if (!priceNq) {
      priceStrNq = '???'
      tipNq = tooltipForNoPrice; styleNq = styleForNoPrice
    }
    if (!priceHq) {
      priceStrHq = '???'
      tipHq = tooltipForNoPrice; styleHq = styleForNoPrice
    }
    return {
      name: getPriceTypeName(priceType),
      priceStrNq, priceStrHq,
      priceNq, tipNq, styleNq,
      priceHq, tipHq, styleHq
    }
    function getPriceTypeName(ptype: ItemPriceType) {
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
  })

  return {
    havePrice, lastUpdate, priceExpired, prices
  }
})
const refreshingItemPrice = ref(false)
const refreshItemPrice = async () => {
  if (refreshingItemPrice.value) {
    NAIVE_UI_MESSAGE.info(t('item.price.refreshing'))
    return
  }
  refreshingItemPrice.value = true
  try {
    const itemPrices = await getItemPriceInfo(props.itemInfo.id, store.funcConfig.universalis_server)
    Object.keys(itemPrices).forEach(id => {
      const itemID = Number(id)
      store.funcConfig.cache_item_prices[itemID] = itemPrices[itemID]
    })
    store.updateFuncConfig()
    NAIVE_UI_MESSAGE.success(t('item.price.update_succeed'))
  } catch (error: any) {
    const errMsg = handleGetPriceError(error, t)
    NAIVE_UI_MESSAGE.error(t('common.message.get_price_failed') + '\n' + errMsg)
  }
  refreshingItemPrice.value = false
}
const showPriceDetailModal = () => {
  showItemPriceDetail([props.itemInfo])
}

const innerPopTrigger = computed(() => {
  if (!isMobile.value && store.userConfig.click_to_show_pop_in_span) {
    return 'click'
  } else {
    return undefined
  }
})
const handleOnScroll = (e: Event) => {
  const target = e.target as HTMLElement
  popScrolling.value = target.scrollTop > 0
}
</script>

<template>
  <n-popover
    v-if="itemInfo.id && !disablePop"
    :trigger="popTrigger || (isMobile ? 'click' : 'hover')"
    :placement="isMobile ? 'bottom' : 'right-start'"
    :width="popUseCustomWidth ? popCustomWidth : (isMobile ? 'trigger' : undefined)"
    :style="{
      maxWidth: popMaxWidth ?? (isMobile ? 'unset' : '290px'),
    }"
  >
    <template #trigger>
      <slot />
    </template>
    <ItemInfoHeader :item-info="itemInfo" />
    <div class="item-level">{{ t('item.text.item_level_with_val', itemInfo.itemLevel) }}</div>
    <n-divider class="item-divider" />
    <!-- 版本/ID等 -->
    <div class="item-attributes" :class="{ scrolling: popScrolling }">
      <div class="item-type">
        <XivFARImage
          class="item-icon"
          :src="itemInfo.uiTypeIconUrl"
          :size="14"
        />
        <p>{{ getItemTypeName() }}</p>
      </div>
      <p>{{ t('item.text.basic_info', { patch: itemInfo.patch, id: itemInfo.id }) }}</p>
    </div>
    <n-scrollbar class="select-text max-h-110" @scroll="handleOnScroll">
      <!-- 抬头 -->
      <div class="item-descriptions">
        <!-- 游戏内物品描述 -->
        <div class="main-descriptions" v-html="getItemDescriptions()"></div>
        <!-- 装备属性 -->
        <div class="description-block" v-if="itemInfo.attrsProvided.length">
          <div class="title">
            {{ t('common.armor_attr') }}
            <HqSwitcher v-model:hq="showItemHqAttr" :readonly="!itemHasHQ" :size="12" class="extra" />
          </div>
          <n-divider class="item-divider" />
          <div class="content armor" v-if="showItemHqAttr">
            <div
              class="item"
              v-for="(attr, index) in itemInfo.attrsProvided"
              :key="'attr-hq' + index"
            >
              <div>{{ `${getAttrName(attr[0])} +${attr[2]}` }}</div>
            </div>
          </div>
          <div class="content armor" v-else>
            <div
              class="item"
              v-for="(attr, index) in itemInfo.attrsProvided"
              :key="'attr-nq' + index"
            >
              <div>{{ `${getAttrName(attr[0])} +${attr[1]}` }}</div>
            </div>
          </div>
          <div v-if="isMobile" class="content extra">
            ※ {{ t('item.text.curr_show_hqornq', [(showItemHqAttr ? 'HQ' : 'NQ')]) }}
          </div>
        </div>
        <!-- 使用效果(食物/爆发药) -->
        <div class="description-block" v-if="itemInfo.tempAttrsProvided.length">
          <div class="title">
            {{ t('common.effect') }}
            <HqSwitcher v-model:hq="showItemHqAttr" :readonly="!itemHasHQ" :size="12" class="extra" />
          </div>
          <n-divider class="item-divider" />
          <div class="content">
            <div class="item" v-for="(attrText, atIndex) in itemTempAttrTexts" :key="'temp-attr-' + atIndex">
              <div>{{ attrText }}</div>
            </div>
          </div>
          <div v-if="isMobile" class="content extra">
            ※ {{ t('item.text.curr_show_hqornq', [(showItemHqAttr ? 'HQ' : 'NQ')]) }}
          </div>
        </div>
        <!-- 精选信息 -->
        <div class="description-block" v-if="itemInfo.canReduceFrom?.length || itemInfo.canReduceTo">
          <div class="title">{{ t('common.reduce') }}</div>
          <n-divider class="item-divider" />
          <div class="content" v-if="itemInfo.canReduceFrom?.length">
            <div>{{ t('item.text.reduce_info') }}</div>
            <div class="item" v-for="(reduce, reduceIndex) in itemInfo.canReduceFrom" :key="'reduce-' + reduceIndex">
              <ItemSpan :item-info="getItemInfo(reduce)" :container-id="containerId" />
            </div>
          </div>
          <div class="content" v-else-if="itemInfo.canReduceTo">
            <div>{{ t('item.text.reduce_can_get') }}</div>
            <div class="item">
              <ItemSpan :item-info="getItemInfo(itemInfo.canReduceTo)" :container-id="containerId" hide-pop-icon />
            </div>
          </div>
        </div>
        <!-- 笔记 -->
        <div class="description-block" v-if="uiLanguage === 'zh' && XivItemRemarks[itemInfo.id]?.length">
          <div class="title">笔记</div>
          <n-divider class="item-divider" />
          <div class="content">
            <ItemRemark
              :remarks="XivItemRemarks[itemInfo.id]"
              style="line-height: 1.2;"
              :pop-trigger="innerPopTrigger"
            />
          </div>
        </div>
        <!-- 采集 -->
        <div class="description-block" v-if="itemInfo.gatherInfo || itemInfo.isFishingItem">
          <div class="title">
            {{ t('common.gather') }}
            <div v-if="itemInfo.gatherInfo" class="extra">
              <XivFARImage
                class="icon"
                :src="XivJobs[itemInfo.gatherInfo.jobId].job_icon_url"
              />
              <p v-if="itemInfo.gatherInfo.level !== itemInfo.gatherInfo.nodelevel">
                {{ t('item.text.gather_level_info', {
                  lv: itemInfo.gatherInfo.level,
                  job: getJobName(XivJobs[itemInfo.gatherInfo.jobId])
                }) }}
              </p>
              <p v-else>{{ getJobName(XivJobs[itemInfo.gatherInfo.jobId]) }}</p>
            </div>
            <div v-if="itemInfo.isFishingItem" class="extra">
              <XivFARImage
                class="icon"
                :src="XivJobs[18].job_icon_url"
              />
              <p>{{ getJobName(XivJobs[18]) }}</p>
            </div>
            <div v-if="itemInfo.gatherInfo?.[`gntype_${uiLanguage}`]" class="extra">
              {{ ' - ' }}
              {{ itemInfo.gatherInfo[`gntype_${uiLanguage}`] }}
            </div>
          </div>
          <n-divider class="item-divider" />
          <div class="content" v-if="itemInfo.gatherInfo">
            <div class="other-attrs" v-if="itemGatherDifficulty" style="gap: 2px;">
              {{ itemGatherDifficulty.diffText }}
              <HelpButton
                :size="12"
                icon="question"
                color="var(--color-info)"
                pop-type="popover"
                :placement="isMobile ? 'bottom' : 'right-start'"
                style="padding: 0;"
              >
                <div>
                  <div class="font-bold">{{ t('item.gather_threshold.title.gather_threshold') }}</div>
                  <n-table size="small" class="content-table tiny-table w-full">
                    <thead>
                      <tr>
                        <th>{{ t('item.gather_threshold.title.field') }}</th>
                        <th>{{ t('item.gather_threshold.title.threshold') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(threshold, index) in itemGatherDifficulty.gatherThresholds"
                        :key="'gatherThresholds-' + index"
                      >
                        <td>{{ threshold.field }}</td>
                        <td>{{ threshold.value }}</td>
                      </tr>
                    </tbody>
                  </n-table>
                  <div style="height: 4px;" />
                  <div class="font-bold">{{ t('item.gather_threshold.title.perception_threshold') }}</div>
                  <n-table size="small" class="content-table tiny-table w-full">
                    <thead>
                      <tr>
                        <th>{{ t('item.gather_threshold.title.field') }}</th>
                        <th>{{ t('item.gather_threshold.title.threshold') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(threshold, index) in itemGatherDifficulty.perceptionThresholds"
                        :key="'perceptionThresholds-' + index"
                      >
                        <td>{{ threshold.field }}</td>
                        <td>{{ threshold.value }}</td>
                      </tr>
                    </tbody>
                  </n-table>
                </div>
              </HelpButton>
            </div>
            <div>{{ t('item.text.gather_pos_info') }}</div>
            <div class="item">
              <LocationSpan
                :place-id="itemInfo.gatherInfo.placeID"
                :place-name="getPlaceName()"
                :coordinate-x="itemInfo.gatherInfo.posX"
                :coordinate-y="itemInfo.gatherInfo.posY"
                :pop-trigger="innerPopTrigger"
                pop-style="padding: 0;"
              />
            </div>
            <div class="other-attrs" v-if="itemInfo.gatherInfo.recommAetheryte" style="margin-left: 1em;">
              ※ 
              {{ t('map.text.recomm_aetheryte') + ' - ' }}
              {{ itemInfo.gatherInfo.recommAetheryte?.[`name_${itemLanguage}`] }}
            </div>
          </div>
          <div class="content" v-if="itemInfo.gatherInfo?.timeLimitInfo?.length">
            <div>{{ t('item.text.gather_time_info') }}</div>
            <div
              class="item"
              v-for="(timeLimit, timeLimitIndex) in itemInfo.gatherInfo?.timeLimitInfo"
              :key="'time-limit-' + timeLimitIndex"
            >
              <div>{{ timeLimit.start }} ~ {{ timeLimit.end }}</div>
              <div class="color-success">{{ timeCanGather(timeLimit) }}</div>
            </div>
          </div>
          <div class="content" v-if="itemInfo.gatherInfo?.folkloreId || itemInfo?.gatherInfo?.requirement">
            <div>{{ t('item.text.gather_condi') }}</div>
            <div class="item small-font" v-if="itemInfo?.gatherInfo?.requirement">
              <div>
                {{ t('item.text.perception_with_val', itemInfo.gatherInfo?.requirement) }}
              </div>
            </div>
            <div class="item small-font" v-if="itemInfo.gatherInfo?.folkloreId">
              {{ t('item.text.need_learn') }}
              <ItemSpan span-max-width="180px" :img-size="12" :item-info="getItemInfo(itemInfo.gatherInfo.folkloreId)" :container-id="containerId" />
            </div>
          </div>
          <div class="content" v-if="itemInfo.gatherInfo?.bonuses?.length">
            <div>{{ t('item.text.gather_bonus') }}</div>
            <ul class="list small-font">
              <li
                v-for="(bonus, bonusIndex) in itemInfo.gatherInfo.bonuses"
                :key="'bonus-' + bonusIndex"
              >
                {{
                  t('item.text.gather_bonus_description', [
                    getAttrName(bonus.condition.attribute),
                    bonus.condition.value,
                  ])
                }}{{ bonus.bonus[`text_${uiLanguage}`] }}
              </li>
            </ul>
          </div>
          <div class="content" v-if="itemInfo.isFishingItem">
            <div>{{ t('item.text.gather_website.intro') }}</div>
            <div class="item actions">
              <n-button size="small" @click="openInAngler">
                <template #icon>
                  <n-icon><OpenInNewFilled /></n-icon>
                </template>
                {{ t('common.open_in.angler_search') }}
              </n-button>
              <n-button size="small" @click="openInMomola">
                <template #icon>
                  <n-icon><OpenInNewFilled /></n-icon>
                </template>
                {{ t('common.open_in.ffmomola') }}
              </n-button>
            </div>
          </div>
          <div v-show="false" class="content extra" v-if="itemInfo.isFishingItem">
            {{ t('item.text.gather_website.note') }}
          </div>
        </div>
        <!-- 收藏品交易 -->
        <div class="description-block" v-if="itemInfo.collectInfo">
          <div class="title">
            {{ t('common.submission') }}
            <div class="extra">
              <i class="xiv collectables"></i>{{ t('common.collectable_submission') }}
            </div>
          </div>
          <n-divider class="item-divider" />
          <div class="content">
            <ItemSubmissionReward :item-info="itemInfo" />
          </div>
        </div>
        <!-- 兑换 -->
        <div class="description-block" v-if="tradeCostList.length">
          <div class="title">{{ t('common.trade') }}</div>
          <n-divider class="item-divider" />
          <div class="content">
            <div>{{ t('item.text.is_tradable') }}</div>
            <template v-for="(cost, index) in tradeCostList" :key="index">
              <div class="item trade-item">
                {{ index > 0 ? t('common.or') : '' }}
                <ItemSpan
                  span-max-width="230px"
                  :item-info="getItemInfo(cost.costId)"
                  :amount="cost.costCount"
                  show-amount
                  :container-id="containerId"
                />
              </div>
              <div class="item trade-item trade-item-l2" v-if="cost.cost2Id && cost.cost2Count">
                {{ t('common.and') }}
                <ItemSpan
                  span-max-width="210px"
                  :item-info="getItemInfo(cost.cost2Id)"
                  :amount="cost.cost2Count"
                  show-amount
                  :container-id="containerId"
                />
              </div>
              <div class="item trade-item trade-item-l2" v-if="cost.cost3Id && cost.cost3Count">
                {{ t('common.and') }}
                <ItemSpan
                  span-max-width="210px"
                  :item-info="getItemInfo(cost.cost3Id)"
                  :amount="cost.cost3Count"
                  show-amount
                  :container-id="containerId"
                />
              </div>
              <div class="item other-attrs" v-if="cost.receiveCount > 1">
                {{ t('item.text.multi_get_each_trade', cost.receiveCount) }}
              </div>
              <div class="item other-attrs trade-item" v-if="cost.receive2Id && cost.receive2Count">
                {{ t('item.text.trade_also_receive') }}
                <ItemSpan
                  span-max-width="80px"
                  :item-info="getItemInfo(cost.receive2Id)"
                  :img-size="12"
                  :amount="cost.receive2Count"
                  :show-amount="cost.receive2Count > 1"
                  :container-id="containerId"
                  style="width: fit-content;"
                />
              </div>
            </template>
          </div>
        </div>
        <!-- 制作 -->
        <div class="description-block" v-if="itemInfo.craftRequires.length">
          <div class="title">
            {{ t('common.craft.title') }}
            <div class="extra">
              <XivFARImage
                class="icon"
                :src="XivJobs[itemInfo.craftInfo?.jobId].job_icon_url"
              />
              <p>
                {{ t('item.text.recipe_level_info', {
                  lv: itemInfo.craftInfo?.craftLevel,
                  star: '★'.repeat(itemInfo.craftInfo?.starCount || 0),
                  job: getJobName(XivJobs[itemInfo.craftInfo?.jobId])
                }) }}
              </p>
            </div>
          </div>
          <n-divider class="item-divider" />
          <div class="content">
            <div class="other-attrs">
              {{ t('item.text.recipe_detail', {
                dur: itemInfo.craftInfo?.durability,
                pro: itemInfo.craftInfo?.progress,
                qua: itemInfo.craftInfo?.quality
              }) }}
              <a
                v-if="itemInfo?.craftInfo?.recipeId"
                style="padding: 0; display: flex; align-items: center; line-height: 1.2; cursor: pointer;"
                :title="t('item.text.simulate_craft_bestcraft')"
                @click="openInBestCraft"
              >
                <n-icon :size="12"><OpenInNewFilled /></n-icon>
                {{ t('common.simulate_craft') }}
              </a>
            </div>
            <div
              class="item"
              v-for="(item, index) in itemCraftRequires"
              :key="'recipe-' + index"
            >
              <ItemSpan :item-info="getItemInfo(item.id)" :amount="item.count" show-amount :container-id="containerId" />
            </div>
            <div class="other-attrs" v-if="(itemInfo.craftInfo?.yields || 1) > 1">
              {{ t('item.text.yields_info', itemInfo.craftInfo?.yields) }}
            </div>
            <div v-if="itemInfo.craftInfo?.thresholds?.craftsmanship || itemInfo.craftInfo?.thresholds?.control || itemInfo.craftInfo?.masterRecipeId">
              <div>{{ t('item.text.craft_condi') }}</div>
              <div class="item small-font">
                <div v-if="itemInfo.craftInfo?.thresholds?.craftsmanship">
                  {{ t('item.text.craftsmanship_with_val', itemInfo.craftInfo?.thresholds?.craftsmanship) }}
                </div>
                <div v-if="itemInfo.craftInfo?.thresholds?.control">
                  {{ t('item.text.control_with_val', itemInfo.craftInfo?.thresholds?.control) }}
                </div>
              </div>
              <div class="item small-font" v-if="itemInfo.craftInfo?.masterRecipeId">
                {{ t('item.text.need_learn') }}
                <ItemSpan span-max-width="180px" :img-size="12" :item-info="getItemInfo(itemInfo.craftInfo.masterRecipeId)" :container-id="containerId" />
              </div>
            </div>
            <div class="other-attrs">
              <div v-if="!itemInfo.craftInfo?.qsable" style="color: var(--color-error);">{{ t('item.text.cannot_quick_synthesis') }}</div>
              <div v-if="!itemInfo.craftInfo?.hqable" style="color: var(--color-error);">{{ t('item.text.cannot_hq') }}</div>
            </div>
          </div>
        </div>
        <!-- 价格 -->
        <div class="description-block" v-if="store.funcConfig.universalis_showpriceinpop && itemInfo.tradable">
          <div class="title">
            {{ t('common.price') }}
            <div class="extra flex">
              <div>
                <span>{{ t('common.last_update_with_val', '') }}</span>
                <span :style="{ color: itemPriceInfo.priceExpired ? 'var(--color-error)' : undefined }">
                  {{ itemPriceInfo.lastUpdate }}
                </span>
              </div>
              <a
                :disabled="refreshingItemPrice"
                style="padding: 0; margin-left: 3px; display: flex; line-height: 1;"
                :style="refreshingItemPrice ? 'cursor: not-allowed; color: gray;' : 'cursor: pointer;'"
                @click="refreshItemPrice"
              >
                <n-icon :size="12"><RefreshOutlined /></n-icon>
                {{ refreshingItemPrice ? t('common.refreshing') : t('common.refresh') }}
              </a>
              <a
                style="padding: 0; margin-left: 3px; display: flex; line-height: 1;"
                @click="showPriceDetailModal"
              >
                <n-icon :size="12"><TableViewFilled /></n-icon>
                {{ t('item.price.detail_table.intro_short') }}
              </a>
            </div>
          </div>
          <n-divider class="item-divider" />
          <div class="content">
            <div v-if="itemPriceInfo.prices.length" class="content-table">
              <n-table size="small" class="tiny-table w-full">
                <thead>
                  <tr>
                    <th></th>
                    <th>NQ</th>
                    <th v-if="itemInfo.hqable">HQ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(price, index) in itemPriceInfo.prices"
                    :key="'price-' + index"
                  >
                    <td>{{ price.name }}</td>
                    <td>
                      <div :style="price.styleNq" :title="price.tipNq">{{ price.priceStrNq }}</div>
                    </td>
                    <td v-if="itemInfo.hqable">
                      <div :style="price.styleHq" :title="price.tipHq">{{ price.priceStrHq }}</div>
                    </td>
                  </tr>
                </tbody>
              </n-table>
            </div>
            <div v-else style="text-indent: 1em;">
              {{ t('item.price.no_show_price_type_setted', t('preference.universalis_poppricetypes.title')) }}
            </div>
          </div>
        </div>
        <!-- 插槽，目前好像没用到 -->
        <slot name="extra-descriptions" />
        <!-- 注 -->
        <div class="tail-descriptions">
          <p v-for="(desc, index) in itemTailDescriptions" :key="'tail-descriptions' + index">
            {{ t('common.note_x', itemTailDescriptions.length === 1 ? '' : index + 1) }}{{ desc }}
          </p>
        </div>
      </div>
    </n-scrollbar>
  </n-popover>
  <slot v-else />
</template>

<style scoped>
.small-font {
  font-size: calc(var(--n-font-size) - 2px);
}
.content-table {
  td {
    min-width: 50px;
  }
  tr>th:not(:first-child),
  tr>td:not(:first-child) {
    text-align: right;
  }
}

.item-level {
  line-height: 1.2;
  margin-top: 3px;
}
.item-divider {
  margin: 0 2px;
}
.item-attributes {
  display: flex;
  align-items: center;
  gap: 3px;
  line-height: 1.2;
  flex-wrap: wrap;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -4px;
    height: 4px;

    opacity: 0;
    transition: opacity .2s;

    background: var(--color-background-popover);
    border-top: 1px solid var(--color-border);
  }
  &.scrolling::after {
    opacity: 1;
    z-index: 1;
  }

  .item-type {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  .item-type::before { content: "["; }
  .item-type::after { content: "]"; }
}
.item-descriptions {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .main-descriptions {
    text-indent: 1em;
    line-height: 1.2;
  }
  .temp-attr-descriptions {
    line-height: 1.2;

    .title {
      margin-top: 2px;
    }
    .content {
      margin-left: 1em;
    }
    .content .block p::before {
      content: "· ";
    }
    .extra {
      font-size: calc(var(--n-font-size) - 2px);
      margin: 2px 0 5px;
    }
  }
  .description-block {
    line-height: 1.2;

    .title {
      font-weight: bold;
      display: flex;
      align-items: baseline;
      --size-small: calc(var(--n-font-size) - 2px);
      --textgap-left: calc(var(--n-font-size) - 1px);

      .extra {
        margin-left: 3px;
        font-weight: normal;
        font-size: var(--size-small);
        line-height: 1;

        img {
          float: left;
          height: var(--size-small);
          display: block;
        }
        p {
          font-size: var(--size-small);
          padding-left: var(--textgap-left);
        }
      }
      .extra::after {
        content: '';
        clear: both;
        display: block;
      }
    }
    .content .item {
      margin-left: 1em;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 3px;
    }
    .content .item.trade-item {
      flex-wrap: nowrap;
    }
    .content .item.trade-item-l2 {
      margin-left: 1.5em;
    }
    .content .item.actions {
      margin: 3px 1em;
      flex-direction: column;

      button {
        width: 100%;
      }
    }
    .content.armor {
      width: fit-content;
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      column-gap: 5px;
    }
    .content .list {
      margin-left: 1em;
      padding-left: 1em;
      li::marker {
        content: ' > ';
      }
    }
    .content .content-table {
      width: fit-content;
      margin-top: 2px;
      margin-left: 1em;
    }
    .content .other-attrs,
    .content.extra {
      display: flex;
      align-items: center;
      gap: 0 5px;
      flex-wrap: wrap;
      font-size: calc(var(--n-font-size) - 2px);
    }
  }
  .tail-descriptions {
    margin-top: 5px;
    font-size: calc(var(--n-font-size) - 2px);
    line-height: 1;
  }
}
</style>