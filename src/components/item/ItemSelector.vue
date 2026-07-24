<script setup lang="ts">
import {
  type SelectOption, type SelectRenderLabel,
} from 'naive-ui'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useLocale } from '@/composables/useLocale'
import { XivUnpackedItems } from '@/assets/data'
import { getItemInfo, getMaterialItems } from '@/tools/item'

const { t } = useLocale()

interface ItemSelectorProps {
  /** 仅在 custom 模式有效 */
  options?: number[]
  optionsPreset?: "craftable" | "custom" | "materials"
  containerId?: string
  dontCleanAfterSelect?: boolean
}
const props = defineProps<ItemSelectorProps>()
const emits = defineEmits(['onItemSelected'])

const itemInputValue = defineModel<number | null>({
  default: null,
})

const optionsPreset = computed(() => props.optionsPreset ?? 'craftable')
const itemOptions = computed(() => {
  if (optionsPreset.value === 'craftable') {
    return Object.values(XivUnpackedItems).filter(item => item.rids?.length > 0).map(item => {
      return {
        value: item.id
      }
    })
  } else if (optionsPreset.value === 'custom' && props.options) {
    return props.options.map(item => {
      return {
        value: item
      }
    })
  } else {
    const items = getMaterialItems()
    return items.map(item => {
      return {
        value: item
      }
    })
  }
  
})
const renderItemLabel : SelectRenderLabel = (option) => {
  if (!option.value || typeof option.value !== 'number') {
    return h('div', null, [option.label as string])
  }
  return h(ItemSpan, {
    itemInfo: getItemInfo(option.value),
    containerId: props.containerId,
  })
}
const filterItem = (pattern: string, option: SelectOption) => {
  if (!pattern) {
    return true
  }
  if (!option.value || typeof option.value !== 'number') {
    return false
  }
  const item = getItemInfo(option.value)

  let itemMatched = false
  const availableKeywords = [
    item.name_zh, item.name_en, item.name_ja
  ]
  availableKeywords.forEach(keyword => {
    if (keyword?.toLowerCase().includes(pattern.toLowerCase())) {
      itemMatched = true
    }
  })
  if (itemMatched) return true

  if (item.id.toString() === pattern) return true
  if (item.itemLevel.toString() === pattern) return true
  if (item.patch === pattern) return true

  return false
}

const handleItemInputValueUpdate = (value: number) => {
  if (!value) return
  emits('onItemSelected', value)
  if (!props.dontCleanAfterSelect) itemInputValue.value = null
}
</script>

<template>
  <n-select
    v-model:value="itemInputValue"
    filterable
    :filter="filterItem"
    :options="itemOptions"
    :render-label="renderItemLabel"
    :placeholder="t('common.item_search_input_placeholder')"
    :title="t('common.item_search_input_placeholder')"
    @update:value="handleItemInputValueUpdate"
  />
</template>

<style scoped>
</style>