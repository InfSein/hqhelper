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

const precrafts = computed(() => {
  return lv1Items.value.filter(item => item.craftInfo?.jobId)
})

const materials = computed(() => classifyMaterials(materialTarget.value))

/**
 * 表示限时采集品统计（包括灵砂）。
 */
const gatheringsTimed = computed(() => [
  ...materials.value.aethersands,
  ...materials.value.gatherableLimited,
])
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
          :items="materials.tomeScriptItems"
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
          :items="materials.crystals"
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
          :items="materials.gatherableCommon"
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
          :items="materials.other"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
  </div>
</template>

<style scoped>
</style>