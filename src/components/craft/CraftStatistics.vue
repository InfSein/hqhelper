<script setup lang="ts">
import ItemList from '@/components/item/ItemList.vue'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { useNbbCal } from '@/tools/use-nbb-cal'
import { useStore } from '@/store'

// const store = useStore()
// const NAIVE_UI_MESSAGE = useMessage()
const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()

interface CraftStatisticsProps {
  itemSelected: Record<number, number>
  hidePrecraftMaterials?: boolean
  listHeight?: number
}
const props = defineProps<CraftStatisticsProps>()

const { calItems } = useNbbCal()

const statistics = computed(() => {
  const value = calItems(props.itemSelected)
  return value
})

const lv1Items = computed(() => {
  const items = []
  for (const id in statistics.value.lv1) {
    try {
      const item = getItemInfo(statistics.value.lv1[id])
      items.push(item)
    } catch (error) {
      console.warn('[compute.lv1Items] Error processing item ' + id + ':', error)
    }
  }
  return items
})
const lvBaseItems = computed(() => {
  const items = []
  for (const id in statistics.value.lvBase) {
    try {
      const item = getItemInfo(statistics.value.lvBase[id])
      items.push(item)
    } catch (error) {
      console.warn('[compute.lvBaseItems] Error processing item ' + id + ':', error)
    }
  }
  return items
})

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
      : t('statistics.group_tooltip.common_material_lvbase')
  ]
})

/**
 * 表示要展示的半成品。
 */
const precrafts = computed(() => {
  const crafts : ItemInfo[] = []
  lv1Items.value.forEach(item => {
    if (item.craftInfo?.jobId) {
      crafts.push(item)
    }
  })
  return crafts
})

/**
 * 表示需要用亚拉戈神典石或工票兑换的道具。
 */
const tomeScriptItems = computed(() => {
  const items : ItemInfo[] = []
  materialTarget.value.forEach(material => {
    if (material.isAethersand) return
    if (material.gatherInfo?.jobId) return
    if (!material.tradeInfo) return
    items.push(material)
  })
  return items
})

/**
 * 表示碎晶/水晶/晶簇统计。
 */
const crystals = computed(() => {
  const _crystals : ItemInfo[] = []
  materialTarget.value.forEach(material => {
    if (material.isCrystal) {
      _crystals.push(material)
    }
  })
  return _crystals
})

/**
 * 表示限时采集品统计。
 * 包括灵砂。
 */
const gatheringsTimed = computed(() => {
  const aethersands : ItemInfo[] = []
  const gathers : ItemInfo[] = []

  materialTarget.value.forEach(material => {
    if (material.isAethersand) {
      aethersands.push(material)
    }
    if (material.gatherInfo?.timeLimitInfo?.length) {
      gathers.push(material)
    }
  })

  return [...aethersands, ...gathers]
})

/**
 * 表示非限时(常规)采集品统计。
 */
const gatheringsCommon = computed(() => {
  const gathers : ItemInfo[] = []
  materialTarget.value.forEach(material => {
    if (material.gatherInfo?.placeID && !material.gatherInfo.timeLimitInfo?.length) {
      gathers.push(material)
    }
  })
  return gathers
})

/**
 * 表示其他道具统计。
 */
const otherMaterials = computed(() => {
  const items : ItemInfo[] = []
  materialTarget.value.forEach(material => {
    if (material.isAethersand) return
    if (material.craftInfo?.jobId) return
    if (material.gatherInfo?.placeID) return
    if (material.tradeInfo) return
    if (material.isCrystal) return
    if (material.gatherInfo) return
    items.push(material)
  })
  return items
})
</script>

<template>
  <div class="cs-wrapper">
    <GroupBox id="common-precrafts-group" class="group">
      <template #title>{{ t('statistics.group.precrafts') }}</template>
      <div class="container">
        <ItemList
          :items="precrafts"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="tome-script-group" class="group"
      :title="t('statistics.group.trade_items')"
      :descriptions="materialTargetDescription"
    >
      <div class="container">
        <ItemList
          :items="tomeScriptItems"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="crystals-group" class="group"
      :title="t('statistics.group.crystal')"
      :descriptions="materialTargetDescription"
    >
      <div class="container">
        <ItemList
          :items="crystals"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="common-gatherings-group" class="group"
      :title="t('statistics.group.common_gathering2')"
      :descriptions="materialTargetDescription"
    >
      <div class="container">
        <ItemList
          :items="gatheringsCommon"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="timed-gatherings-group" class="group"
      :title="t('statistics.group.time_limited_gathering_and_aethersands')"
      :descriptions="materialTargetDescription"
    >
      <div class="container">
        <ItemList
          :items="gatheringsTimed"
          :list-height="listHeight ?? (isMobile ? undefined : 245)"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
        />
      </div>
    </GroupBox>
    <GroupBox
      id="other-materials-group" class="group"
      :title="t('statistics.group.other_materials.title')"
      :descriptions="[
        t('statistics.group.other_materials.tooltip'),
        ...materialTargetDescription
      ]"
    >
      <div class="container">
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
.cs-wrapper {
  row-gap: 15px;
  column-gap: 10px;
}
/* Desktop */
@media screen and (min-width: 768px) {
  .cs-wrapper {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .cs-wrapper {
    display: flex;
    flex-direction: column;
  }
}
</style>