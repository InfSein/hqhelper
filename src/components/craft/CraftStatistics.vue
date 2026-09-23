<script setup lang="ts">
import ItemList from '@/components/item/ItemList.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { classifyMaterials } from '@/tools/item'
import type { StatementData } from '@/types/core'

const { t } = useLocale()
const store = useStore()
const { isMobile } = useResponsive()

interface CraftStatisticsProps {
  statistics: StatementData
  hidePrecraftMaterials?: boolean
  listHeight?: number
}
const props = defineProps<CraftStatisticsProps>()

const lv1Items = computed(() => props.statistics.materialsLv1)
const lvBaseItems = computed(() => props.statistics.materialsLvBase)

const materialTarget = computed(() => {
  if (props.hidePrecraftMaterials) {
    return lv1Items.value
  } else {
    return lvBaseItems.value
  }
})
const materialTargetDescription = computed(() => {
  return [
    props.hidePrecraftMaterials
      ? t('statistics.group_tooltip.common_material_lv1')
      : t('statistics.group_tooltip.common_material_lvbase'),
  ]
})

/**
 * 表示要展示的半成品。
 */
const precrafts = computed(() => {
  return lv1Items.value.filter(item => item.craftInfo?.jobId)
})

const classified = computed(() => classifyMaterials(materialTarget.value))

/**
 * 表示需要用亚拉戈神典石或工票兑换的道具。
 */
const tomeScriptItems = computed(() => classified.value.tradable)

/**
 * 表示碎晶/水晶/晶簇统计。
 */
const crystals = computed(() => classified.value.crystals)

/**
 * 表示限时采集品统计（包括灵砂）。
 */
const gatheringsTimed = computed(() => [
  ...classified.value.aethersands,
  ...classified.value.gatherableLimited,
])

/**
 * 表示非限时(常规)采集品统计。
 */
const gatheringsCommon = computed(() => classified.value.gatherableCommon)

/**
 * 表示其他道具统计。
 */
const otherMaterials = computed(() => classified.value.other)
</script>

<template>
  <div class="flex flex-col md:grid md:grid-cols-3 gap-y-3.75 gap-x-2.5">
    <GroupBox id="common-precrafts-group">
      <template #title>{{ t('statistics.group.precrafts') }}</template>
      <div>
        <ItemList
          :items="precrafts"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="tome-script-group"
      :title="t('statistics.group.trade_items')"
      :descriptions="materialTargetDescription"
    >
      <div>
        <ItemList
          :items="tomeScriptItems"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="crystals-group"
      :title="t('statistics.group.crystal')"
      :descriptions="materialTargetDescription"
    >
      <div>
        <ItemList
          :items="crystals"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="common-gatherings-group"
      :title="t('statistics.group.common_gathering2')"
      :descriptions="materialTargetDescription"
    >
      <div>
        <ItemList
          :items="gatheringsCommon"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="timed-gatherings-group"
      :title="t('statistics.group.time_limited_gathering_and_aethersands')"
      :descriptions="materialTargetDescription"
    >
      <div>
        <ItemList
          :items="gatheringsTimed"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="other-materials-group"
      :title="t('statistics.group.other_materials.title')"
      :descriptions="[
        t('statistics.group.other_materials.tooltip'),
        ...materialTargetDescription
      ]"
    >
      <div>
        <ItemList
          :items="otherMaterials"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
  </div>
</template>

<style scoped>
</style>