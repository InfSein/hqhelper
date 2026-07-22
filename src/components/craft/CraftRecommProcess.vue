<script setup lang="ts">
// import { 
//   SettingsSharp,
//   UnfoldMoreSharp, UnfoldLessSharp,
// } from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import LocationSpan from '@/components/map/LocationSpan.vue'
import GatheringPathButton from '@/components/map/GatheringPathButton.vue'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import UseConfig from '@/composables/useConfig'
import { XivJobs, type XivJob } from '@/assets/data'
import type EorzeaTime from '@/utils/game.et'
import type { RecommItemGroup } from '@/types/item'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
const currentET = inject<Ref<EorzeaTime>>('currentET')!

const store = useStore()
const {
  itemLanguage,
} = UseConfig()

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
const itemGroups = computed(() => {
  return props.itemGroups
})

const getJobName = (jobInfo: XivJob) => {
  switch (store.userConfig.language_ui) {
    case 'ja':
      return jobInfo?.job_name_ja || t('common.unknown')
    case 'en':
      return jobInfo?.job_name_en || t('common.unknown')
    default:
      return jobInfo?.job_name_zh || t('common.unknown')
  }
}
const getPlaceName = (itemInfo : ItemInfo) => {
  switch (itemLanguage.value) {
    case 'ja':
      return itemInfo.gatherInfo?.placeNameJA
    case 'en':
      return itemInfo.gatherInfo?.placeNameEN
    case 'zh':
    default:
      return itemInfo.gatherInfo?.placeNameZH
  }
}
const textsGatherAt = computed(() => {
  const [p1, p2] = t('recomm_process.text.gather_at_with_val', '{}').split('{}')
  return { p1, p2 }
})

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

const handleItemCompletionChange = (groupIndex: number) => {
  let needToCollapseGroup = true
  Object.values(completedItems.value[groupIndex]).forEach(completed => {
    needToCollapseGroup = needToCollapseGroup && completed
  })
  if (needToCollapseGroup) {
    expandedBlocks.value[groupIndex] = []
  }
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
                  @update:checked="handleItemCompletionChange(groupIndex)"
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
                <span v-if="isItemGatherableNow(item)" class="color-success" style="margin-left: 3px;">{{ t('common.gatherable_now') }}</span>
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
      .gather-detail-position {
        display: flex;
        flex-wrap: wrap;
        margin-left: 1em;
        font-size: calc(var(--n-font-size) - 2px);
      }
    }
  }
}
</style>
