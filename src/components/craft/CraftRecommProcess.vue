<script setup lang="ts">
// import { 
//   SettingsSharp,
//   UnfoldMoreSharp, UnfoldLessSharp,
// } from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import LocationSpan from '@/components/map/LocationSpan.vue'
import GatheringPathButton from '@/components/map/GatheringPathButton.vue'
import { useStore } from '@/store'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useItemLocale } from '@/composables/useItemLocale'
import { useEorzeaTime } from '@/composables/useEorzeaTime'
import { XivJobs, XivUnpackedNpcs } from '@/assets/data'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo, RecommItemGroup } from '@/types/item'

const store = useStore()
const { t } = useLocale()
const { itemLanguage } = useConfig()
const { getJobName, getPlaceName, getPlaceNameById, getNpcName } = useItemLocale()
const { currentET } = useEorzeaTime()

const expandedBlocks = defineModel<Record<number, string[]>>('expandedBlocks', { required: true })
const completedItems = defineModel<Record<number, Record<number, boolean>>>('completedItems', { required: true })

export interface CraftRecommProcessesProps {
  contentMaxWidth?: string;
  contentMaxHeight?: string;
  itemGroups: RecommItemGroup[];
  itemSpanMaxWidth?: string
  containerId?: string;
  hideChsOfflineItems?: boolean;
}
const props = defineProps<CraftRecommProcessesProps>()

const showItemGatherDetails = computed(() => {
  return store.funcConfig.processes_show_item_details
})
const showItemBuyDetails = computed(() => {
  return store.funcConfig.processes_show_purchase_info
})
const itemGroups = computed(() => {
  return props.itemGroups
})

const textsGatherAt = computed(() => {
  const [p1, p2] = t('recomm_process.text.gather_at_with_val', '{}').split('{}')
  return { p1, p2 }
})

type ShopDetailPart =
  | { type: "text"; value: string }
  | { type: "loc"; placeId: number; placeName: string; x: number; y: number }
  | { type: "gil" }

/**
 * 构造物品的 NPC 商店购买详情渲染片段
 */
const getShopDetailParts = (item: ItemInfo): ShopDetailPart[] => {
  const shopInfo = item.gilShopInfo
  if (!shopInfo) return []

  const price = shopInfo.costCount.toLocaleString()
  const npc = shopInfo.npc ? XivUnpackedNpcs[shopInfo.npc] : undefined
  const hasNpcLocation = !!(npc?.place && npc?.coords)

  const LOC_TOKEN = '__SHOP_LOC__'
  const GIL_TOKEN = '__SHOP_GIL__'

  const rawText = hasNpcLocation && npc
    ? t('recomm_process.text.buy_from_npc_with_val', {
        loc: LOC_TOKEN,
        npc: getNpcName(npc),
        price,
        gil: GIL_TOKEN,
      })
    : t('recomm_process.text.buy_from_shop_with_val', {
        price,
        gil: GIL_TOKEN,
      })

  return rawText
    .split(/(__SHOP_LOC__|__SHOP_GIL__)/)
    .filter(Boolean)
    .map((segment): ShopDetailPart => {
      if (segment === LOC_TOKEN && npc) {
        return {
          type: 'loc',
          placeId: npc.place,
          placeName: getPlaceNameById(npc.place),
          x: npc.coords.x,
          y: npc.coords.y,
        }
      }
      if (segment === GIL_TOKEN) {
        return { type: 'gil' }
      }
      return { type: 'text', value: segment }
    })
}

const tomeScripts = computed(() : ItemInfo[] => {
  const group = itemGroups.value.find(group => group.type === 'trade-tomescript')
  if (!group) return []
  const groupIndex = itemGroups.value.indexOf(group)

  const tradeMap: Record<number, number> = {}
    group.items.forEach(item => {
    if (completedItems.value[groupIndex][item.id]) return
    const cost = item.tradeInfo
    if (cost) {
      const tradeprice = cost.costCount * item.amount
      if (tradeMap[cost.costId]) {
        tradeMap[cost.costId] += tradeprice
      } else {
        tradeMap[cost.costId] = tradeprice
      }
    }
  })
  const tomeScripts : ItemInfo[] = []
  Object.keys(tradeMap).forEach(costId => {
    const tomeScript = getItemInfo(Number(costId))
    tomeScript.amount = tradeMap[Number(costId)]
    tomeScripts.push(tomeScript)
  })
  return tomeScripts
})

const getGatheringPathTargets = (group: RecommItemGroup, groupIndex: number) => {
  const targets: ItemInfo[] = []
  group.items.forEach(item => {
    if (completedItems.value[groupIndex][item.id]) return
    if (item.gatherInfo) {
      targets.push(item)
    }
  })
  return targets
}

/** 判断指定素材是否仍被任意一个未勾选的列表物品作为配方素材使用 */
const isMaterialUsedByAnyUncheckedItem = (matId: number): boolean => {
  for (let gIdx = 0; gIdx < itemGroups.value.length; gIdx++) {
    const group = itemGroups.value[gIdx]
    for (const otherItem of group.items) {
      // 已勾选的物品不再需要继续筹集其配方素材
      if (completedItems.value[gIdx]?.[otherItem.id]) continue
      if (otherItem.craftRequires?.some(req => req.id === matId)) {
        return true
      }
    }
  }
  return false
}

/**
 * 勾选上级物品后，自动勾选未被其他未完成物品使用的配方素材（支持多级级联）
 * @returns 状态发生变更的分组索引集合
 */
const autoCompleteUnusedMaterials = (rootItem: ItemInfo): Set<number> => {
  const affectedGroups = new Set<number>()
  const queue: ItemInfo[] = [rootItem]
  const processedItemIds = new Set<number>()

  while (queue.length > 0) {
    const currentItem = queue.shift()!
    if (processedItemIds.has(currentItem.id)) continue
    processedItemIds.add(currentItem.id)

    for (const req of currentItem.craftRequires ?? []) {
      const matId = req.id
      if (isMaterialUsedByAnyUncheckedItem(matId)) continue

      // 跳过顶层目标分组，避免将独立制造目标误当做下级素材自动勾选
      for (let gIdx = 0; gIdx < itemGroups.value.length; gIdx++) {
        const group = itemGroups.value[gIdx]
        if (group.type === 'craft-target') continue

        for (const targetItem of group.items) {
          if (targetItem.id !== matId) continue
          completedItems.value[gIdx] ??= {}
          if (!completedItems.value[gIdx][matId]) {
            completedItems.value[gIdx][matId] = true
            affectedGroups.add(gIdx)
            // 若该素材自身也有配方，继续向下检查其下级素材
            if (targetItem.craftRequires?.length) {
              queue.push(targetItem)
            }
          }
        }
      }
    }
  }

  return affectedGroups
}

/** 若分组内所有物品均已勾选完成，则自动折叠该分组 */
const collapseGroupIfAllCompleted = (groupIndex: number) => {
  const group = itemGroups.value[groupIndex]
  if (!group?.items.length) return
  const allCompleted = group.items.every(item => !!completedItems.value[groupIndex]?.[item.id])
  if (allCompleted) {
    expandedBlocks.value[groupIndex] = []
  }
}

const handleItemCompletionChange = (groupIndex: number, item: ItemInfo, checked: boolean) => {
  completedItems.value[groupIndex] ??= {}
  completedItems.value[groupIndex][item.id] = checked

  const affectedGroups = new Set<number>([groupIndex])
  if (checked) {
    autoCompleteUnusedMaterials(item).forEach(gIdx => affectedGroups.add(gIdx))
  }

  affectedGroups.forEach(gIdx => collapseGroupIfAllCompleted(gIdx))
}

const isItemGatherableNow = (item: ItemInfo) => {
  let gatherable = false
  item.gatherInfo.timeLimitInfo?.forEach(info => {
    const parseTime = (time: string) => time.split(':').reduce((acc, val, idx) => acc + parseInt(val) * [60, 1][idx], 0)
    const s = parseTime(info.start)
    const e = parseTime(info.end)
    const c = currentET.value.hour * 60 + currentET.value.minute
    if (c >= s && c < e) {
      gatherable = true
    }
  })
  return gatherable
}
</script>

<template>
  <div class="wrapper" :style="{
    maxHeight: contentMaxHeight ?? '375px',
    overflowY: contentMaxHeight === 'auto' ? 'hidden' : 'auto'
  }">
    <div
      class="block"
      v-for="(group, groupIndex) in itemGroups"
      :key="'group-' + groupIndex"
      :style="{
        maxWidth: contentMaxWidth,
      }"
    >
      <n-collapse arrow-placement="right" v-model:expanded-names="expandedBlocks[groupIndex]">
        <n-collapse-item name="1">
          <template #header>
            <div class="title">
              <span class="icon">
                <XivFARImage
                  :size="14"
                  :src="group.icon"
                  class="select-none"
                />
              </span>
              <span>
                {{ groupIndex + 1 }}. {{ group.title }}
              </span>
              <component v-if="group.subtitle" :is="group.subtitle"></component>
              <div v-else-if="group.type === 'trade-tomescript'" class="flex items-center flex-wrap gap-0.5 ml-2">
                <p v-show="tomeScripts.length">{{ t('statement.table.requires') }}</p>
                <ItemSpan
                  v-for="item in tomeScripts"
                  :key="'ts-' + item.id"
                  :item-info="item"
                  :amount="item.amount"
                  show-amount
                  hide-name hide-pop-icon
                  :container-id="containerId"
                  container-style="gap: 0;"
                />
              </div>
              <GatheringPathButton 
                v-if="group.type === 'gather-common'"
                :target-items="getGatheringPathTargets(group, groupIndex)"
                :container-id="containerId"
                style="margin-left: 4px;"
              />
            </div>
          </template>

          <div class="description" v-if="group.description">{{ group.description }}</div>
          <div class="items">
            <div
              v-for="item in group.items"
              :key="'item-' + item.id"
              style=""
            >
              <div class="item-container">
                <n-checkbox
                  size="small"
                  v-model:checked="completedItems[groupIndex][item.id]"
                  @update:checked="(checked: boolean) => handleItemCompletionChange(groupIndex, item, checked)"
                />
                <ItemSpan
                  :item-info="item"
                  :amount="item.amount"
                  show-amount
                  :span-max-width="itemSpanMaxWidth"
                  :container-id="containerId"
                />
              </div>
              <div
                class="gather-detail-time"
                v-if="showItemGatherDetails && item.gatherInfo?.timeLimitDescription && !completedItems[groupIndex][item.id]"
              >
                <span style="margin-right: 1px;">(</span>
                <span>{{ t('recomm_process.text.time_limit_with_val', item.gatherInfo.timeLimitDescription) }}</span>
                <span v-if="isItemGatherableNow(item)" class="text-primary" style="margin-left: 3px;">{{ t('common.gatherable_now') }}</span>
                <span style="margin-left: 1px;">)</span>
              </div>
              <div
                class="gather-detail-position"
                v-if="showItemGatherDetails && item.gatherInfo?.placeID && !completedItems[groupIndex][item.id]"
              >
                <span style="margin-right: 1px;">(</span>
                <span v-if="showItemGatherDetails && item.gatherInfo?.placeID">{{ textsGatherAt.p1 }}</span>
                <LocationSpan
                  v-if="showItemGatherDetails && item.gatherInfo?.placeID"
                  :place-id="item.gatherInfo.placeID"
                  :place-name="getPlaceName(item)"
                  :coordinate-x="item.gatherInfo.posX"
                  :coordinate-y="item.gatherInfo.posY"
                  :size="12"
                  style="margin: 0 2px 0 1px; "
                />
                <span v-if="showItemGatherDetails && item.gatherInfo?.placeID">{{ textsGatherAt.p2 }}</span>
                <span style="margin-left: 1px;">)</span>
              </div>
              <div
                class="gather-detail-recomm"
                v-if="showItemGatherDetails && item.gatherInfo?.placeID && !completedItems[groupIndex][item.id]"
              >
                <span v-if="store.funcConfig.processes_merge_gatherings" style="margin-right: 1px;">(</span>
                <span v-if="store.funcConfig.processes_merge_gatherings" class="flex items-center">
                  <XivFARImage
                    class="icon select-none"
                    :src="XivJobs[item.gatherInfo.jobId].job_icon_url"
                    :size="12"
                  />
                  <p>{{ getJobName(XivJobs[item.gatherInfo.jobId]) }}</p>
                </span>
                <span v-if="store.funcConfig.processes_merge_gatherings" style="margin: 0 3px 0 1px;">)</span>
                <span style="margin-right: 1px;">(</span>
                <span>{{ t('map.text.recomm_aetheryte') }} - {{ item.gatherInfo.recommAetheryte?.[`name_${itemLanguage}`] }}</span>
                <span style="margin-left: 1px;">)</span>
              </div>
              <div
                class="buy-detail"
                v-if="showItemBuyDetails && item.gilShopInfo && !completedItems[groupIndex][item.id]"
              >
                <span style="margin-right: 1px;">(</span>
                <template v-for="(part, partIndex) in getShopDetailParts(item)" :key="partIndex">
                  <LocationSpan
                    v-if="part.type === 'loc'"
                    :place-id="part.placeId"
                    :place-name="part.placeName"
                    :coordinate-x="part.x"
                    :coordinate-y="part.y"
                    :size="12"
                    style="margin: 0 2px 0 1px;"
                  />
                  <i v-else-if="part.type === 'gil'" class="xiv gil" />
                  <span v-else class="whitespace-pre-wrap">{{ part.value }}</span>
                </template>
                <span style="margin-left: 1px;">)</span>
              </div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-card__action) {
  padding-top: 15px;
  padding-bottom: 15px;
}
:deep(.n-collapse-item__content-inner) {
  padding-top: 0 !important;
}

/* All */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
  user-select: text;
  overflow-y: auto;

  .block {
    line-height: 1.2;

    .title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      span {
        font-weight: bold;
      }
      span.icon {
        display: flex;
        margin-right: 3px;
      }
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin: 3px 0 0 1em;

      .item-container {
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .gather-detail-time,
      .gather-detail-recomm,
      .gather-detail-position,
      .buy-detail {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        margin-left: 1em;
        font-size: var(--app-font-size-xs);
      }
    }
  }
}
</style>
